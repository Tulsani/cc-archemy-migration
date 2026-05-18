import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { adminAclApiUrl, cognitoConfig } from './auth.config';

interface CognitoAuthResult {
  AccessToken: string;
  ExpiresIn: number;
  IdToken: string;
  RefreshToken?: string;
  TokenType: string;
}

interface CognitoResponse {
  AuthenticationResult?: CognitoAuthResult;
  ChallengeName?: 'NEW_PASSWORD_REQUIRED';
  Session?: string;
  ChallengeParameters?: Record<string, string>;
}

export interface AuthenticatedUser {
  email: string;
  firstName: string;
  lastName: string;
  userId: string;
  role: string;
  claims: Record<string, unknown>;
  idToken: string;
  accessToken: string;
  userACL?: UserAclDocument;
}

export interface UserAclDocument {
  role?: string;
  permissionIds?: string[];
  capabilities?: Record<string, boolean>;
  domainIds?: Array<string | number>;
  customerIds?: Array<string | number>;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storageKey = 'archemy-auth-session';
  private challengeSession = '';
  private challengeUsername = '';

  readonly user = signal<AuthenticatedUser | null>(this.restoreSession());
  readonly loading = signal(false);
  readonly error = signal('');
  readonly requiresNewPassword = signal(false);
  readonly isAuthenticated = computed(() => !!this.user());

  async signIn(email: string, password: string): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    this.requiresNewPassword.set(false);

    try {
      this.assertConfigured();
      const username = email.trim().toLowerCase();
      const response = await this.cognitoRequest<CognitoResponse>('AWSCognitoIdentityProviderService.InitiateAuth', {
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: cognitoConfig.clientId,
        AuthParameters: {
          USERNAME: username,
          PASSWORD: password,
        },
      });

      if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
        this.challengeSession = response.Session || '';
        this.challengeUsername = username;
        this.requiresNewPassword.set(true);
        return;
      }

      if (!response.AuthenticationResult) throw new Error('Cognito did not return tokens.');
      await this.acceptAuthResult(response.AuthenticationResult);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to sign in.');
    } finally {
      this.loading.set(false);
    }
  }

  async completeNewPassword(newPassword: string): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      this.assertConfigured();
      if (!this.challengeSession || !this.challengeUsername) throw new Error('Password challenge session expired. Sign in again.');

      const response = await this.cognitoRequest<CognitoResponse>('AWSCognitoIdentityProviderService.RespondToAuthChallenge', {
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        ClientId: cognitoConfig.clientId,
        Session: this.challengeSession,
        ChallengeResponses: {
          USERNAME: this.challengeUsername,
          NEW_PASSWORD: newPassword,
        },
      });

      if (!response.AuthenticationResult) throw new Error('Cognito did not return tokens after password reset.');
      this.challengeSession = '';
      this.challengeUsername = '';
      this.requiresNewPassword.set(false);
      await this.acceptAuthResult(response.AuthenticationResult);
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Unable to set new password.');
    } finally {
      this.loading.set(false);
    }
  }

  signOut(): void {
    this.challengeSession = '';
    this.challengeUsername = '';
    this.requiresNewPassword.set(false);
    this.user.set(null);
    localStorage.removeItem(this.storageKey);
  }

  async refreshAcl(): Promise<UserAclDocument | undefined> {
    const current = this.user();
    if (!current?.userId) return undefined;

    try {
      const response = await this.http
        .get<{ success: boolean; user?: { userACL?: UserAclDocument }; userACL?: UserAclDocument }>(
          `${adminAclApiUrl}?queryType=get-acl-by-user&userId=${encodeURIComponent(current.userId)}`,
        )
        .toPromise();
      const userACL = response?.userACL || response?.user?.userACL;
      if (userACL) {
        const nextUser = { ...current, userACL };
        this.user.set(nextUser);
        this.persistSession(nextUser);
      }
      return userACL;
    } catch {
      return current.userACL;
    }
  }

  private async acceptAuthResult(result: CognitoAuthResult): Promise<void> {
    const claims = decodeJwt(result.IdToken);
    const user: AuthenticatedUser = {
      email: claimString(claims, 'email'),
      firstName: claimString(claims, 'given_name'),
      lastName: claimString(claims, 'family_name'),
      userId: claimString(claims, 'custom:userId') || claimString(claims, 'sub'),
      role: claimString(claims, 'custom:role') || claimString(claims, 'role') || 'user',
      claims,
      idToken: result.IdToken,
      accessToken: result.AccessToken,
    };

    this.user.set(user);
    this.persistSession(user);
    await this.refreshAcl();
  }

  private async cognitoRequest<T>(target: string, payload: object): Promise<T> {
    const response = await fetch(`https://cognito-idp.${cognitoConfig.region}.amazonaws.com/`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-amz-json-1.1',
        'x-amz-target': target,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.__type || 'Cognito request failed.');
    }
    return data as T;
  }

  private restoreSession(): AuthenticatedUser | null {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private persistSession(user: AuthenticatedUser): void {
    localStorage.setItem(this.storageKey, JSON.stringify(user));
  }

  private assertConfigured(): void {
    if (cognitoConfig.userPoolId.startsWith('<') || cognitoConfig.clientId.startsWith('<')) {
      throw new Error('Fill Cognito userPoolId and clientId in src/app/auth.config.ts.');
    }
  }
}

function decodeJwt(token: string): Record<string, unknown> {
  const [, payload] = token.split('.');
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const json = decodeURIComponent(
    Array.from(atob(padded))
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join(''),
  );
  return JSON.parse(json);
}

function claimString(claims: Record<string, unknown>, key: string): string {
  const value = claims[key];
  return typeof value === 'string' ? value : '';
}
