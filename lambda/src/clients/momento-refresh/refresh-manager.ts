import {
  AuthClient,
  CredentialProvider,
  RefreshAuthToken,
  CacheClient,
  Configurations,
  ListCaches,
  MomentoErrorCode,
} from '@gomomento/sdk';
import {MomentoRefresh} from './momento-refresh';
import {SecretManagerTokenStore} from '../../models/secret-manager-token';
import {TokenStatus} from '../../utils/token-status';
import {Common} from '../../utils/common';

export class MomentoRefreshManager implements MomentoRefresh {
  private readonly invalidAuthTokenResponse: MomentoErrorCode[] = [
    MomentoErrorCode.AUTHENTICATION_ERROR,
    MomentoErrorCode.PERMISSION_ERROR,
  ];

  public async refreshAuthToken(
    currentAuthToken: SecretManagerTokenStore
  ): Promise<RefreshAuthToken.Success> {
    const refreshResponse = await new AuthClient({
      credentialProvider: CredentialProvider.fromString({
        authToken: currentAuthToken.getAuthToken(),
      }),
    }).refreshAuthToken(currentAuthToken.refreshToken);

    if (refreshResponse instanceof RefreshAuthToken.Error) {
      Common.logAndThrow(refreshResponse.toString());
    }
    return refreshResponse as RefreshAuthToken.Success;
  }

  public async isValidAuthToken(
    authToken: SecretManagerTokenStore,
    versionStage: string | undefined
  ): Promise<TokenStatus> {
    const cacheClient = new CacheClient({
      credentialProvider: CredentialProvider.fromString({
        authToken: authToken.getAuthToken(),
      }),
      configuration: Configurations.InRegion.Default.latest(),
      defaultTtlSeconds: 60,
    });
    const listResponse = await cacheClient.listCaches();

    if (listResponse instanceof ListCaches.Error) {
      if (this.invalidAuthTokenResponse.includes(listResponse.errorCode())) {
        console.warn(
          `Invalid api token for stage ${
            versionStage ? versionStage : 'undefined'
          }, client error code: ${listResponse.errorCode()}`
        );
        return TokenStatus.INVALID;
      } else {
        // This is best effort, if we get an error other then an authentication error, we can just move on
        console.warn(
          `Failed to test api token, client error code: ${listResponse.errorCode()}`
        );
        return TokenStatus.NOT_TESTED;
      }
    }
    return TokenStatus.VALID;
  }
}
