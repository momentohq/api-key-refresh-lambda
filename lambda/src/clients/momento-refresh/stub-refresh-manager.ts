import {RefreshAuthToken, ExpiresAt} from '@gomomento/sdk';
import {MomentoRefresh} from './momento-refresh';
import {SecretManagerTokenStore} from '../../models/secret-manager-token';
import {TokenStatus} from '../../utils/token-status';
import {Common} from '../../utils/common';

export class MomentoStubRefreshManager implements MomentoRefresh {
  public async refreshAuthToken(
    _currentAuthToken: SecretManagerTokenStore
  ): Promise<RefreshAuthToken.Success> {
    return new RefreshAuthToken.Success(
      'authToken',
      'refreshToken',
      'endpoint',
      ExpiresAt.fromEpoch(1683692355)
    );
  }
  public async isValidAuthToken(
    _authToken: SecretManagerTokenStore,
    versionStage: string | undefined
  ): Promise<TokenStatus> {
    if (!versionStage) {
      return TokenStatus.NOT_TESTED;
    }
    return Common.getEnv().mockTokenStatus.get(versionStage)!;
  }
}
