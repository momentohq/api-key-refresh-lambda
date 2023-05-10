import {SecretsManager} from '@aws-sdk/client-secrets-manager';
import {MomentoSecretsManager} from './momento-secrets/secrets-manager';
import {MomentoStubSecretsManager} from './momento-secrets/stub-secrets-manager';
import {MomentoSecrets} from './momento-secrets/momento-secrets';
import {MomentoRefresh} from './momento-refresh/momento-refresh';
import {MomentoStubRefreshManager} from './momento-refresh/stub-refresh-manager';
import {MomentoRefreshManager} from './momento-refresh/refresh-manager';

export class ClientFactory {
  public static getMomentoSecretsManager(
    useLocalStubs: boolean
  ): MomentoSecrets {
    if (useLocalStubs) {
      return new MomentoStubSecretsManager('{}', {
        a: ['AWSPREVIOUS'],
        b: ['AWSCURRENT'],
        c: ['AWSPENDING'],
      });
    }
    return new MomentoSecretsManager(new SecretsManager({}));
  }

  public static getMomentoRefreshManager(
    useLocalStub: boolean
  ): MomentoRefresh {
    if (useLocalStub) {
      return new MomentoStubRefreshManager();
    }
    return new MomentoRefreshManager();
  }
}
