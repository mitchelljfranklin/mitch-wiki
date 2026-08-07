import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { KyselyDB } from '@docmost/db/types/kysely.types';
import {
  AuthProvider,
  InsertableAuthProvider,
  UpdatableAuthProvider,
} from '@docmost/db/types/entity.types';

@Injectable()
export class AuthProvidersRepo {
  constructor(@InjectKysely() private readonly database: KyselyDB) {}

  /**
   * Finds an enabled auth provider by ID and workspace.
   * Used by the OIDC login flow — only enabled providers should be usable.
   */
  async findById(
    providerId: string,
    workspaceId: string,
  ): Promise<AuthProvider | undefined> {
    return this.database
      .selectFrom('authProviders')
      .selectAll()
      .where('id', '=', providerId)
      .where('workspaceId', '=', workspaceId)
      .where('isEnabled', '=', true)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  /**
   * Finds any auth provider by ID (enabled or disabled).
   * Used by the CRUD management endpoints so admins can edit
   * providers regardless of their enabled state.
   */
  async findByIdIncludeDisabled(
    providerId: string,
    workspaceId: string,
  ): Promise<AuthProvider | undefined> {
    return this.database
      .selectFrom('authProviders')
      .selectAll()
      .where('id', '=', providerId)
      .where('workspaceId', '=', workspaceId)
      .where('deletedAt', 'is', null)
      .executeTakeFirst();
  }

  async findByWorkspaceId(
    workspaceId: string,
  ): Promise<Pick<AuthProvider, 'id' | 'name' | 'type' | 'oidcIssuer' | 'oidcClientId' | 'isEnabled' | 'allowSignup' | 'createdAt' | 'updatedAt'>[]> {
    return this.database
      .selectFrom('authProviders')
      .select([
        'id',
        'name',
        'type',
        'oidcIssuer',
        'oidcClientId',
        'isEnabled',
        'allowSignup',
        'createdAt',
        'updatedAt',
      ])
      .where('workspaceId', '=', workspaceId)
      .where('deletedAt', 'is', null)
      .orderBy('createdAt', 'asc')
      .execute();
  }

  async createProvider(
    data: InsertableAuthProvider,
  ): Promise<AuthProvider> {
    return this.database
      .insertInto('authProviders')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }

  async updateProvider(
    id: string,
    data: UpdatableAuthProvider,
  ): Promise<void> {
    await this.database
      .updateTable('authProviders')
      .set({ ...data, updatedAt: new Date() })
      .where('id', '=', id)
      .execute();
  }

  async deleteProvider(id: string): Promise<void> {
    await this.database
      .updateTable('authProviders')
      .set({ deletedAt: new Date(), updatedAt: new Date() })
      .where('id', '=', id)
      .execute();
  }
}
