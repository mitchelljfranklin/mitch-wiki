import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Public } from '../../../common/decorators/public.decorator';
import { OidcService } from '../strategies/oidc.strategy';
import { EnvironmentService } from '../../../integrations/environment/environment.service';

@Controller('sso')
export class SsoController {
  constructor(
    private readonly oidcService: OidcService,
    private readonly environmentService: EnvironmentService,
  ) {}

  /**
   * Initiates the OIDC login flow.
   * Redirects the user to the IdP's authorization endpoint.
   */
  @Public()
  @Get('oidc/:providerId/login')
  async oidcLogin(
    @Param('providerId') providerId: string,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const workspaceId = (req.raw as any).workspaceId;
    const authorizationUrl = await this.oidcService.getAuthorizationUrl(
      providerId,
      workspaceId,
    );
    return res.status(302).redirect(authorizationUrl);
  }

  /**
   * Handles the OIDC callback from the IdP after user authentication.
   * Exchanges the authorization code for tokens, finds or creates the user,
   * creates a session, and sets the auth cookie.
   */
  @Public()
  @Get('oidc/:providerId/callback')
  async oidcCallback(
    @Param('providerId') providerId: string,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const workspaceId = (req.raw as any).workspaceId;
    const result = await this.oidcService.handleCallback(
      providerId,
      workspaceId,
      req.query as Record<string, string>,
    );
    this.setAuthCookie(res, result.authToken);
    return res.status(302).redirect('/home');
  }

  private setAuthCookie(res: FastifyReply, token: string) {
    res.setCookie('authToken', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      expires: this.environmentService.getCookieExpiresIn(),
      secure: this.environmentService.isHttps(),
    });
  }
}
