import {CredentialProvider, RefreshApiToken} from '@gomomento/sdk';
import {AuthClient} from '@gomomento/sdk/dist/src/auth-client';
import {MomentoRefresh} from './momento-refresh';
import {SecretManagerTokenStore} from '../../models/secret-manager-token';
import {AuthTokenRefreshManager} from '../../auth-token-refresh-manager';

export class MomentoRefreshManager implements MomentoRefresh {
  public async refreshApiToken(
    currentApiToken: SecretManagerTokenStore
  ): Promise<RefreshApiToken.Success> {
    const refreshResponse = await new AuthClient().refreshApiToken(
      CredentialProvider.fromString({
        authToken: currentApiToken.apiToken,
      }),
      currentApiToken.refreshToken
    );

    if (refreshResponse instanceof RefreshApiToken.Error) {
      AuthTokenRefreshManager.logAndThrow(refreshResponse.toString());
    }
    return refreshResponse as RefreshApiToken.Success;
  }
}
