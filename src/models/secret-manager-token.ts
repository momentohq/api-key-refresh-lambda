import {RefreshApiToken} from '@gomomento/sdk';

// secrets manager likes to add trailing commas, which JSON.parse handles by throwing an error :)
// so lets remove those with this easy to read regex!
const trailingCommaRemoval = /(.*?),\s*(\}|])/g;

export class SecretManagerTokenStore {
  apiToken: string;
  refreshToken: string;
  validUntil: number;

  public withApiToken(apiToken: string): SecretManagerTokenStore {
    this.apiToken = apiToken;
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

  public toString(): string {
    return `{
      "apiToken": "${this.apiToken}",
      "refreshToken": "${this.refreshToken}",
      "validUntil": "${this.validUntil}"
    }`;
  }

  public static fromString(
    currentSecretAsString: string
  ): SecretManagerTokenStore {
    const removedTrailingCommas = currentSecretAsString.replace(
      trailingCommaRemoval,
      '$1$2'
    );
    return Object.assign(
      new SecretManagerTokenStore(),
      JSON.parse(removedTrailingCommas)
    ) as SecretManagerTokenStore;
  }

  public static fromRefreshApiTokenResponse(
    refreshApiToken: RefreshApiToken.Success
  ): SecretManagerTokenStore {
    const base64Jwt = Buffer.from(
      `{"endpoint": "${refreshApiToken.endpoint}", "api_key": "${refreshApiToken.apiToken}"}`
    ).toString('base64');
    return new SecretManagerTokenStore()
      .withApiToken(base64Jwt)
      .withRefreshToken(refreshApiToken.refreshToken)
      .withValidUntil(refreshApiToken.expiresAt.epoch());
  }
}
