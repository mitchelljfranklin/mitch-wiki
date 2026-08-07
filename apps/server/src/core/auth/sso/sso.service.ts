import { Injectable } from '@nestjs/common';
import { OidcService } from '../strategies/oidc.strategy';

@Injectable()
export class SsoService {
  constructor(private readonly oidcService: OidcService) {}

  getAuthorizationUrl(providerId: string, workspaceId: string): Promise<string> {
    return this.oidcService.getAuthorizationUrl(providerId, workspaceId);
  }

  handleCallback(
    providerId: string,
    workspaceId: string,
    callbackParams: Record<string, string>,
  ): Promise<{ authToken: string }> {
    return this.oidcService.handleCallback(providerId, workspaceId, callbackParams);
  }
}
