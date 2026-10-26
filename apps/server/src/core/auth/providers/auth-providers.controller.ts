import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { AuthProvidersService } from './auth-providers.service';
import { CreateAuthProviderDto } from './dto/create-auth-provider.dto';
import { UpdateAuthProviderDto } from './dto/update-auth-provider.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AuthUser } from '../../../common/decorators/auth-user.decorator';
import { AuthWorkspace } from '../../../common/decorators/auth-workspace.decorator';
import { User, Workspace } from '@docmost/db/types/entity.types';

@UseGuards(JwtAuthGuard)
@Controller('auth/providers')
export class AuthProvidersController {
  constructor(
    private readonly authProvidersService: AuthProvidersService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Post()
  async createProvider(
    @Body() dto: CreateAuthProviderDto,
    @AuthWorkspace() workspace: Workspace,
    @AuthUser() user: User,
  ) {
    return this.authProvidersService.createProvider(
      dto,
      workspace.id,
      user.id,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  async getProviders(@AuthWorkspace() workspace: Workspace) {
    return this.authProvidersService.getProviders(workspace.id);
  }

  @HttpCode(HttpStatus.OK)
  @Put(':id')
  async updateProvider(
    @Param('id') id: string,
    @Body() dto: UpdateAuthProviderDto,
    @AuthWorkspace() workspace: Workspace,
  ) {
    return this.authProvidersService.updateProvider(
      id,
      dto,
      workspace.id,
    );
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  async deleteProvider(@Param('id') id: string) {
    await this.authProvidersService.deleteProvider(id);
  }
}
