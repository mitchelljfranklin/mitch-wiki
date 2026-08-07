import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { KyselyDB } from '@docmost/db/types/kysely.types';
import {
  AuthAccount,
  InsertableAuthAccount,
} from '@docmost/db/types/entity.types';

@Injectable()
export class AuthAccountsRepo {
  constructor(@InjectKysely() private readonly database: KyselyDB) {}

  async findByProviderUserId(
    providerUserId: string,
    authProviderId: string,
  ): Promise<AuthAccount | undefined> {
    return this.database
      .selectFrom('authAccounts')
      .selectAll()
      .where('providerUserId', '=', providerUserId)
      .where('authProviderId', '=', authProviderId)
      .executeTakeFirst();
  }

  async createAccount(
    data: InsertableAuthAccount,
  ): Promise<AuthAccount> {
    return this.database
      .insertInto('authAccounts')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
