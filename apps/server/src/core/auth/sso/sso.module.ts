import { Module } from '@nestjs/common';
import { SsoController } from './sso.controller';
import { SsoService } from './sso.service';
import { OidcService } from '../strategies/oidc.strategy';
import { WorkspaceModule } from '../../workspace/workspace.module';

@Module({
  imports: [WorkspaceModule],
  controllers: [SsoController],
  providers: [SsoService, OidcService],
  exports: [SsoService, OidcService],
})
export class SsoModule {}
