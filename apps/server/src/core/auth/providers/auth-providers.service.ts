import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthProvidersRepo } from '@docmost/db/repos/auth-providers/auth-providers.repo';
import { CreateAuthProviderDto } from './dto/create-auth-provider.dto';
import { UpdateAuthProviderDto } from './dto/update-auth-provider.dto';
import {
  AUDIT_SERVICE,
  IAuditService,
} from '../../../integrations/audit/audit.service';
import { AuditEvent, AuditResource } from '../../../common/events/audit-events';

@Injectable()
export class AuthProvidersService {
  constructor(
    private readonly authProvidersRepo: AuthProvidersRepo,
    @Inject(AUDIT_SERVICE) private readonly auditService: IAuditService,
  ) {}

  async createProvider(
    dto: CreateAuthProviderDto,
    workspaceId: string,
    creatorId: string,
  ) {
    if (dto.type === 'oidc') {
      if (!dto.oidcIssuer || !dto.oidcClientId || !dto.oidcClientSecret) {
        throw new BadRequestException(
          'OIDC provider requires issuer, client ID, and client secret',
        );
      }
    }

    const provider = await this.authProvidersRepo.createProvider({
      name: dto.name,
      type: dto.type,
      oidcIssuer: dto.oidcIssuer ?? null,
      oidcClientId: dto.oidcClientId ?? null,
      oidcClientSecret: dto.oidcClientSecret ?? null,
      allowSignup: dto.allowSignup ?? false,
      isEnabled: dto.isEnabled ?? false,
      creatorId,
      workspaceId,
    });

    this.auditService.log({
      event: AuditEvent.SSO_PROVIDER_CREATED,
      resourceType: AuditResource.SSO_PROVIDER,
      resourceId: provider.id,
      changes: {
        after: {
          name: provider.name,
          type: provider.type,
          isEnabled: provider.isEnabled,
        },
      },
    });

    return this.sanitizeProvider(provider);
  }

  async getProviders(workspaceId: string) {
    const providers =
      await this.authProvidersRepo.findByWorkspaceId(workspaceId);
    return providers.map((provider) => this.sanitizeProvider(provider));
  }

  async updateProvider(
    id: string,
    dto: UpdateAuthProviderDto,
    workspaceId: string,
  ) {
    const existingProvider = await this.authProvidersRepo.findByIdIncludeDisabled(
      id,
      workspaceId,
    );

    if (!existingProvider) {
      throw new NotFoundException('Auth provider not found');
    }

    await this.authProvidersRepo.updateProvider(id, {
      name: dto.name,
      oidcIssuer: dto.oidcIssuer,
      oidcClientId: dto.oidcClientId,
      ...(dto.oidcClientSecret !== undefined
        ? { oidcClientSecret: dto.oidcClientSecret }
        : {}),
      allowSignup: dto.allowSignup,
      isEnabled: dto.isEnabled,
    });

    this.auditService.log({
      event: AuditEvent.SSO_PROVIDER_UPDATED,
      resourceType: AuditResource.SSO_PROVIDER,
      resourceId: id,
    });
  }

  async deleteProvider(id: string) {
    await this.authProvidersRepo.deleteProvider(id);

    this.auditService.log({
      event: AuditEvent.SSO_PROVIDER_DELETED,
      resourceType: AuditResource.SSO_PROVIDER,
      resourceId: id,
    });
  }

  /**
   * Strips sensitive fields (secrets) from provider objects before
   * returning them in API responses.
   */
  private sanitizeProvider(provider: any) {
    const sanitized = { ...provider };
    delete sanitized.oidcClientSecret;
    delete sanitized.deletedAt;
    return sanitized;
  }
}
