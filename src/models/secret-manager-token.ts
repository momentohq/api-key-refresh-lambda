import {RefreshAuthToken} from '@gomomento/sdk';
import {Common} from '../utils/common';

// secrets manager likes to add trailing commas, which JSON.parse handles by throwing an error :)
// so lets remove those with this *easy* to read regex!
const trailingCommaRemoval = /(.*?),\s*(\}|])/g;

export class SecretManagerTokenStore {
  apiToken: string;
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
    return this.apiToken
      ? this.apiToken
      : this.authToken
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
      const removedTrailingCommas = currentSecretAsString.replace(
        trailingCommaRemoval,
        '$1$2'
      );
      return Object.assign(
        new SecretManagerTokenStore(),
        JSON.parse(removedTrailingCommas)
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
