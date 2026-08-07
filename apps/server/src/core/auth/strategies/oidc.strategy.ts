import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthProvidersRepo } from '@docmost/db/repos/auth-providers/auth-providers.repo';
import { AuthAccountsRepo } from '@docmost/db/repos/auth-accounts/auth-accounts.repo';
import { SessionService } from '../../session/session.service';
import { UserRepo } from '@docmost/db/repos/user/user.repo';
import { WorkspaceRepo } from '@docmost/db/repos/workspace/workspace.repo';
import { EnvironmentService } from '../../../integrations/environment/environment.service';
import { WorkspaceService } from '../../workspace/services/workspace.service';
import { GroupUserRepo } from '@docmost/db/repos/group/group-user.repo';
import * as openidClient from 'openid-client';
import { UserRole } from '../../../common/helpers/types/permission';

/** Time-to-live for stored OIDC state entries in milliseconds (10 minutes). */
const OIDC_STATE_TTL_MS = 10 * 60 * 1000;

/** Interval at which the in-memory state store is cleaned of expired entries. */
const OIDC_STATE_CLEANUP_INTERVAL_MS = 60 * 1000;

interface OidcStateEntry {
  state: string;
  nonce: string;
  workspaceId: string;
  redirectUri: string;
  expiresAt: number;
}

@Injectable()
export class OidcService {
  private readonly logger = new Logger(OidcService.name);

  /**
   * In-memory store for OIDC state/nonce pairs.
   * Keys are the opaque `state` value sent to the IdP.
   * For single-instance deployments this is sufficient;
   * multi-instance deployments should replace this with Redis.
   */
  private readonly oidcStateStore = new Map<string, OidcStateEntry>();

  constructor(
    private readonly authProvidersRepo: AuthProvidersRepo,
    private readonly authAccountsRepo: AuthAccountsRepo,
    private readonly userRepo: UserRepo,
    private readonly workspaceRepo: WorkspaceRepo,
    private readonly sessionService: SessionService,
    private readonly environmentService: EnvironmentService,
    private readonly workspaceService: WorkspaceService,
    private readonly groupUserRepo: GroupUserRepo,
  ) {
    this.startCleanupTimer();
  }

  /**
   * Periodically purges expired state entries from the in-memory store
   * to prevent unbounded memory growth.
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      const now = Date.now();
      let removedCount = 0;
      for (const [key, entry] of this.oidcStateStore.entries()) {
        if (entry.expiresAt < now) {
          this.oidcStateStore.delete(key);
          removedCount++;
        }
      }
      if (removedCount > 0) {
        this.logger.debug(`Cleaned up ${removedCount} expired OIDC state entries`);
      }
    }, OIDC_STATE_CLEANUP_INTERVAL_MS);
  }

  /**
   * Builds the authorization URL for a specific OIDC provider.
   *
   * OIDC Flow Step 1: The client (browser) is redirected to the IdP's
   * authorization endpoint with a generated state (CSRF protection) and
   * nonce (replay protection). The workspaceId is stored in the state
   * entry so it can be recovered during the callback (the callback URL
   * originates from the IdP and may not carry workspace context headers).
   */
  async getAuthorizationUrl(
    providerId: string,
    workspaceId: string,
  ): Promise<string> {
    const provider = await this.authProvidersRepo.findById(
      providerId,
      workspaceId,
    );

    if (!provider || provider.type !== 'oidc') {
      throw new UnauthorizedException('OIDC provider not found or not enabled');
    }

    if (!provider.oidcIssuer || !provider.oidcClientId || !provider.oidcClientSecret) {
      throw new UnauthorizedException('OIDC provider is not fully configured');
    }

    const redirectUri = this.buildRedirectUri(providerId);

    // Discover the IdP's OpenID configuration from its issuer URL
    const idpConfig = await openidClient.discovery(
      new URL(provider.oidcIssuer),
      provider.oidcClientId,
      provider.oidcClientSecret,
    );

    const state = openidClient.randomState();
    const nonce = openidClient.randomNonce();
    const codeVerifier = openidClient.randomPKCECodeVerifier();
    const codeChallenge = await openidClient.calculatePKCECodeChallenge(codeVerifier);

    // Store state, nonce, and workspaceId for callback validation.
    // The workspaceId is needed because the callback from the IdP won't
    // carry the workspace context header for multi-tenant (cloud) mode.
    this.oidcStateStore.set(state, {
      state,
      nonce,
      workspaceId,
      redirectUri,
      expiresAt: Date.now() + OIDC_STATE_TTL_MS,
    });

    // Store the code_verifier alongside the state so we can retrieve it later
    this.oidcStateStore.set(`code_verifier:${state}`, {
      state: codeVerifier,
      nonce: '',
      workspaceId,
      redirectUri: '',
      expiresAt: Date.now() + OIDC_STATE_TTL_MS,
    });

    const authorizationUrl = openidClient.buildAuthorizationUrl(
      idpConfig,
      {
        redirect_uri: redirectUri,
        scope: 'openid profile email',
        state,
        nonce,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      },
    );

    return authorizationUrl.href;
  }

  /**
   * Handles the OIDC callback from the IdP after the user authenticates.
   *
   * OIDC Flow Steps 2-7:
   * 2. Validate the `state` parameter to prevent CSRF attacks.
   * 3. Exchange the authorization `code` for tokens (ID token, access token).
   * 4. Validate the ID token's `nonce` claim to prevent replay attacks.
   * 5. Fetch the user's profile from the IdP's userinfo endpoint.
   * 6. Find the existing user via auth_accounts, or create a new user if allowSignup is enabled.
   * 7. Create a session and return a JWT auth token.
   *
   * The workspaceId is recovered from the state store rather than relying
   * on request headers, ensuring it works in multi-tenant (cloud) deployments
   * where the callback originates from the IdP without workspace context.
   */
  async handleCallback(
    providerId: string,
    fallbackWorkspaceId: string,
    callbackParams: Record<string, string>,
  ): Promise<{ authToken: string }> {
    const { state, code } = callbackParams;

    if (!state) {
      throw new UnauthorizedException('Missing OIDC state parameter');
    }

    if (!code) {
      throw new UnauthorizedException('Missing OIDC authorization code');
    }

    // Validate state to prevent CSRF and recover workspaceId
    const storedStateEntry = this.oidcStateStore.get(state);
    if (!storedStateEntry || storedStateEntry.expiresAt < Date.now()) {
      throw new UnauthorizedException(
        'OIDC state mismatch or expired. Please try logging in again.',
      );
    }

    // Retrieve code_verifier
    const codeVerifierEntry = this.oidcStateStore.get(`code_verifier:${state}`);
    const codeVerifier = codeVerifierEntry?.state;

    // Clean up state entries immediately after retrieval
    this.oidcStateStore.delete(state);
    this.oidcStateStore.delete(`code_verifier:${state}`);

    // Recover the workspaceId from the stored state entry.
    // Falls back to the controller-provided value for self-hosted mode.
    const workspaceId = storedStateEntry.workspaceId || fallbackWorkspaceId;

    const provider = await this.authProvidersRepo.findById(
      providerId,
      workspaceId,
    );

    if (!provider) {
      throw new UnauthorizedException('OIDC provider not found or not enabled');
    }

    // Discover the IdP config (same as in getAuthorizationUrl)
    const idpConfig = await openidClient.discovery(
      new URL(provider.oidcIssuer),
      provider.oidcClientId,
      provider.oidcClientSecret,
    );

    // Exchange the authorization code for tokens.
    // Build the full callback URL including the query params (code, state)
    // so openid-client can extract the authorization code.
    const currentCallbackUrl = new URL(storedStateEntry.redirectUri);
    for (const [key, value] of Object.entries(callbackParams)) {
      currentCallbackUrl.searchParams.set(key, value);
    }

    const tokenSet = await openidClient.authorizationCodeGrant(
      idpConfig,
      currentCallbackUrl,
      {
        pkceCodeVerifier: codeVerifier,
        expectedState: state,
      },
    );

    // Validate the ID token's nonce claim
    const idTokenClaims = tokenSet.claims();
    if (!idTokenClaims) {
      throw new UnauthorizedException('ID token missing claims');
    }

    if (storedStateEntry.nonce && idTokenClaims.nonce !== storedStateEntry.nonce) {
      throw new UnauthorizedException('OIDC nonce mismatch');
    }

    // Fetch userinfo from the IdP
    const userinfo = await openidClient.fetchUserInfo(
      idpConfig,
      tokenSet.access_token,
      idTokenClaims.sub,
    );

    const providerUserId = userinfo.sub;
    const userEmail = userinfo.email as string | undefined;
    const userName = (userinfo.name as string) || userinfo.preferred_username || userEmail?.split('@')[0] || 'User';

    if (!providerUserId) {
      throw new UnauthorizedException('OIDC provider did not return a subject identifier');
    }

    // Check if there is an existing auth_account for this provider user
    const existingAccount = await this.authAccountsRepo.findByProviderUserId(
      providerUserId,
      providerId,
    );

    if (existingAccount) {
      const user = await this.userRepo.findById(
        existingAccount.userId,
        workspaceId,
      );

      if (!user) {
        throw new UnauthorizedException('Linked user account not found');
      }

      const authToken = await this.sessionService.createSessionAndToken(user);
      return { authToken };
    }

    // No existing account — try to match by email, or create a new user
    if (!userEmail) {
      throw new UnauthorizedException(
        'OIDC provider did not return an email address. Cannot create or match a user account.',
      );
    }

    const userByEmail = await this.userRepo.findByEmail(userEmail, workspaceId);

    if (userByEmail) {
      // Link the existing user to this provider
      await this.authAccountsRepo.createAccount({
        providerUserId,
        authProviderId: providerId,
        userId: userByEmail.id,
        workspaceId,
      });

      const authToken = await this.sessionService.createSessionAndToken(userByEmail);
      return { authToken };
    }

    // No matching user by email — can we create a new one?
    if (!provider.allowSignup) {
      throw new UnauthorizedException(
        'No account found for this email and automatic sign-up is disabled for this provider.',
      );
    }

    const defaultRole = (await this.workspaceRepo.findById(workspaceId))
      ?.defaultRole || UserRole.MEMBER;

    // Create a new user with a random password (never used — SSO only)
    const { randomBytes } = await import('node:crypto');
    const randomPassword = randomBytes(32).toString('hex');

    const newUser = await this.userRepo.insertUser(
      {
        email: userEmail,
        name: userName,
        password: randomPassword,
        role: defaultRole,
        workspaceId,
        emailVerifiedAt: new Date(),
      },
    );

    // Add user to workspace (assigns default role) and to the default group
    await this.workspaceService.addUserToWorkspace(
      newUser.id,
      workspaceId,
      undefined,
    );
    await this.groupUserRepo.addUserToDefaultGroup(
      newUser.id,
      workspaceId,
    );

    // Link the new user to this OIDC provider
    await this.authAccountsRepo.createAccount({
      providerUserId,
      authProviderId: providerId,
      userId: newUser.id,
      workspaceId,
    });

    const authToken = await this.sessionService.createSessionAndToken(newUser);
    return { authToken };
  }

  /**
   * Builds the OIDC redirect URI that the IdP redirects back to after
   * the user authenticates.
   */
  private buildRedirectUri(providerId: string): string {
    const appUrl = this.environmentService.getAppUrl();
    return `${appUrl}/api/sso/oidc/${providerId}/callback`;
  }
}
