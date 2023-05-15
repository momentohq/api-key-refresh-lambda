import {SecretsManager} from '@aws-sdk/client-secrets-manager';
import {MomentoSecrets} from './momento-secrets/momento-secrets';
import {MomentoSecretsManager} from './momento-secrets/secrets-manager';
import {MomentoStubSecretsManager} from './momento-secrets/stub-secrets-manager';

import {CloudWatch} from '@aws-sdk/client-cloudwatch';
import {MomentoCloudWatch} from './momento-cloudwatch/momento-cloudwatch';
import {MomentoCloudWatchManger} from './momento-cloudwatch/cloudwatch-manager';
import {MomentoStubCloudWatchManger} from './momento-cloudwatch/stub-cloudwatch-manager';

import {MomentoRefresh} from './momento-refresh/momento-refresh';
import {MomentoRefreshManager} from './momento-refresh/refresh-manager';
import {MomentoStubRefreshManager} from './momento-refresh/stub-refresh-manager';
import {Common} from '../utils/common';

export class ClientFactory {
  public static getMomentoSecretsManager(
    useLocalStubs: boolean
  ): MomentoSecrets {
    if (useLocalStubs) {
      return new MomentoStubSecretsManager(Common.getEnv().mockToken, {
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

  public static getMomentoCloudWatchManger(
    useLocalStub: boolean
  ): MomentoCloudWatch {
    if (useLocalStub) {
      return new MomentoStubCloudWatchManger();
    }
    return new MomentoCloudWatchManger(new CloudWatch({}));
  }
}
