import {RefreshAuthToken} from '@gomomento/sdk';
import {Common} from '../utils/common';

export class SecretManagerTokenStore {
  authToken: string;
  refreshToken: string;
  validUntil: number;

  public withAuthToken(authToken: string): SecretManagerTokenStore {
    this.authToken = authToken;
    return this;
  }

  public withRefreshToken(refreshToken: string): SecretManagerTokenStore {
    this.refreshToken = refreshToken;
    return this;
  }

  public withValidUntil(validUntil: number): SecretManagerTokenStore {
    this.validUntil = validUntil;
    return this;
  }

  public getAuthToken(): string {
    return this.authToken
      ? this.authToken
      : Common.logAndThrow('No valid Auth Token found.');
  }

  public toString(): string {
    return `{
      "authToken": "${this.getAuthToken()}",
      "refreshToken": "${this.refreshToken}",
      "validUntil": "${this.validUntil}"
    }`;
  }

  public static fromString(
    currentSecretAsString: string
  ): SecretManagerTokenStore {
    try {
      return Object.assign(
        new SecretManagerTokenStore(),
        JSON.parse(currentSecretAsString)
      ) as SecretManagerTokenStore;
    } catch (error) {
      Common.logErrorAndRethrow(
        'Failed to get a valid momento token from secrets manager',
        error
      );
    }
  }

  public static fromRefreshAuthTokenResponse(
    refreshAuthToken: RefreshAuthToken.Success
  ): SecretManagerTokenStore {
    return new SecretManagerTokenStore()
      .withAuthToken(refreshAuthToken.getAuthToken())
      .withRefreshToken(refreshAuthToken.refreshToken)
      .withValidUntil(refreshAuthToken.expiresAt.epoch());
  }
}
