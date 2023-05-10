import {RefreshApiToken} from '@gomomento/sdk';
import {ExpiresAt} from '@gomomento/sdk-core/dist/src';
import {MomentoRefresh} from './momento-refresh';
import {SecretManagerTokenStore} from '../../models/secret-manager-token';

export class MomentoStubRefreshManager implements MomentoRefresh {
  public async refreshApiToken(
    _currentApiToken: SecretManagerTokenStore
  ): Promise<RefreshApiToken.Success> {
    return new RefreshApiToken.Success(
      'apiToken',
      'refreshToken',
      'endpoint',
      ExpiresAt.fromEpoch(1683692355)
    );
  }
}
