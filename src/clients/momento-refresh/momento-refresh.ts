import {RefreshApiToken} from '@gomomento/sdk';
import {SecretManagerTokenStore} from '../../models/secret-manager-token';

export interface MomentoRefresh {
  refreshApiToken(
    currentApiToken: SecretManagerTokenStore
  ): Promise<RefreshApiToken.Success>;
}
