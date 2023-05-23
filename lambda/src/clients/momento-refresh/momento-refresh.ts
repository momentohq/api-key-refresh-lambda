import {RefreshAuthToken} from '@gomomento/sdk';
import {SecretManagerTokenStore} from '../../models/secret-manager-token';
import {TokenStatus} from '../../utils/token-status';

export interface MomentoRefresh {
  refreshAuthToken(
    currentAuthToken: SecretManagerTokenStore
  ): Promise<RefreshAuthToken.Success>;
  isValidAuthToken(
    currentAuthToken: SecretManagerTokenStore,
    versionStage: string | undefined
  ): Promise<TokenStatus>;
}
