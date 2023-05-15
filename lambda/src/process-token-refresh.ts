import {ResourceNotFoundException} from '@aws-sdk/client-secrets-manager';

import {SecretManagerTokenStore} from './models/secret-manager-token';

import {MomentoSecrets} from './clients/momento-secrets/momento-secrets';
import {MomentoRefresh} from './clients/momento-refresh/momento-refresh';
import {MomentoCloudWatch} from './clients/momento-cloudwatch/momento-cloudwatch';
import {ClientFactory} from './clients/client-factory';

import {Common, SECRET_CURRENT, SECRET_PENDING} from './utils/common';
import {SecretCommandSteps} from './utils/secret-command-steps';
import {AuthRefreshMetrics} from './utils/auth-refresh-metrics';
import {TokenStatus} from './utils/token-status';

export class ProcessTokenRefresh {
  private readonly momentoSecrets: MomentoSecrets;
  private readonly momentoRefresh: MomentoRefresh;
  private readonly momentoCloudwatch: MomentoCloudWatch;

  constructor() {
    const {useStub} = Common.getEnv();
    this.momentoSecrets = ClientFactory.getMomentoSecretsManager(useStub);
    this.momentoRefresh = ClientFactory.getMomentoRefreshManager(useStub);
    this.momentoCloudwatch = ClientFactory.getMomentoCloudWatchManger(useStub);
  }

  public async manualRotation(secretId: string): Promise<string> {
    await this.rotationRequestHandler(
      SecretCommandSteps.createSecret,
      secretId,
      undefined
    );
    await this.rotationRequestHandler(
      SecretCommandSteps.setSecret,
      secretId,
      undefined
    );
    await this.rotationRequestHandler(
      SecretCommandSteps.testSecret,
      secretId,
      undefined
    );
    await this.rotationRequestHandler(
      SecretCommandSteps.finishSecret,
      secretId,
      undefined
    );
    return 'ManualRotation: Success';
  }

  public async automaticRotation(
    secretId: string,
    versionId: string,
    step: SecretCommandSteps
  ): Promise<string> {
    const secretMetadata = await this.momentoSecrets.describeSecret(secretId);

    if (!secretMetadata[versionId]) {
      Common.logAndThrow(
        `Secret version ${versionId} has no stage for rotation of secret ${secretId}.`
      );
    }
    if (secretMetadata[versionId].includes(SECRET_CURRENT)) {
      console.log(
        `Secret version ${versionId} is AWSCURRENT for rotation of secret ${secretId}, nothing to do.`
      );
      return 'Rotation: no-op';
    } else if (!secretMetadata[versionId].includes(SECRET_PENDING)) {
      Common.logAndThrow(
        `Secret version ${versionId} not set as AWSPENDING for rotation of secret ${secretId}`
      );
    }

    return await this.rotationRequestHandler(step, secretId, versionId);
  }

  private async rotationRequestHandler(
    step: SecretCommandSteps,
    secretId: string,
    versionId: string | undefined
  ): Promise<string> {
    switch (step) {
      case SecretCommandSteps.createSecret:
        await this.createSecret(secretId, versionId);
        return `${SecretCommandSteps.createSecret.toString()}: Success`;
      case SecretCommandSteps.setSecret:
        return `${SecretCommandSteps.setSecret.toString()}: no-op`;
      case SecretCommandSteps.testSecret:
        if (Common.getEnv().skipTestingStage) {
          return `${SecretCommandSteps.testSecret.toString()}: no-op`;
        } else {
          await this.testSecret(secretId);
          return `${SecretCommandSteps.testSecret.toString()}: Success`;
        }
      case SecretCommandSteps.finishSecret:
        await this.finishSecret(secretId, versionId);
        return `${SecretCommandSteps.finishSecret.toString()}: Success`;
    }
  }

  private async createSecret(
    secretId: string,
    versionId: string | undefined
  ): Promise<void> {
    const currentAuthTokenString = await this.momentoSecrets.getSecret(
      secretId,
      undefined,
      SECRET_CURRENT
    );
    if (!currentAuthTokenString) {
      Common.logAndThrow('Could not get valid secret');
    }

    const currentToken = SecretManagerTokenStore.fromString(
      currentAuthTokenString
    );

    try {
      await this.momentoSecrets.getSecret(secretId, versionId, SECRET_PENDING);
      console.log(
        `${SecretCommandSteps.createSecret.toString()}: Successfully retrieved secret for ${secretId}.`
      );
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        const refreshAuthTokenResponse =
          await this.momentoRefresh.refreshAuthToken(currentToken);
        const newTokenStore =
          SecretManagerTokenStore.fromRefreshAuthTokenResponse(
            refreshAuthTokenResponse
          );

        await this.momentoSecrets.putSecret(
          secretId,
          newTokenStore.toString(),
          versionId,
          [SECRET_PENDING]
        );

        console.log(
          `${SecretCommandSteps.createSecret.toString()}: Successfully put secret for ${secretId}.`
        );
      } else {
        throw error;
      }
    }
  }

  private async testSecret(secretId: string): Promise<void> {
    console.log('Testing staged pending token');

    const pendingTokenStatus = await this.getTokenStatus(
      secretId,
      SECRET_PENDING
    );

    console.log(`Token test response: ${pendingTokenStatus.toString()}`);

    switch (pendingTokenStatus) {
      case TokenStatus.VALID:
        console.log('Valid api token, nothing else to do.');
        break;
      case TokenStatus.INVALID:
        {
          const currentTokenStatus = await this.getTokenStatus(
            secretId,
            SECRET_CURRENT
          );
          switch (currentTokenStatus) {
            case TokenStatus.VALID:
              console.log('Current staged secret is valid');
              break;
            case TokenStatus.NOT_TESTED:
              await this.momentoCloudwatch.emitMetric(
                AuthRefreshMetrics.FailToTest,
                secretId,
                SECRET_CURRENT
              );
              break;
            case TokenStatus.INVALID:
              await this.momentoCloudwatch.emitMetric(
                AuthRefreshMetrics.NoValidTokens,
                secretId,
                SECRET_CURRENT
              );
              Common.logAndThrow(
                `Failed to refresh api token for secret, ${secretId}`
              );
          }
        }
        break;
      case TokenStatus.NOT_TESTED:
        await this.momentoCloudwatch.emitMetric(
          AuthRefreshMetrics.FailToTest,
          secretId,
          SECRET_PENDING
        );
        break;
    }
  }

  private async finishSecret(
    secretId: string,
    versionId: string | undefined
  ): Promise<void> {
    const getPendingTokenStatus = await this.getTokenStatus(
      secretId,
      SECRET_PENDING
    );

    if (getPendingTokenStatus !== TokenStatus.VALID) {
      Common.logAndThrow(
        `Found non-valid token when finishing secret rotation, not setting pending token to current, token state ${getPendingTokenStatus.toString()}.`
      );
    }

    const versions: Record<string, string[]> =
      await this.momentoSecrets.describeSecret(secretId);

    let currentVersion = undefined;
    for (const item in versions) {
      if (versions[item].includes(SECRET_CURRENT)) {
        if (versionId === item) {
          console.log(
            `${SecretCommandSteps.finishSecret.toString()}: Version ${item} already marked as ${SECRET_CURRENT} for ${secretId}`
          );
          return;
        }
        currentVersion = item;
        break;
      }
    }

    await this.momentoSecrets.updateVersionStage(
      secretId,
      SECRET_CURRENT,
      versionId,
      currentVersion
    );
    console.log(
      `${SecretCommandSteps.finishSecret.toString()}: Successfull set ${SECRET_CURRENT} stage to version ${
        versionId ? versionId : 'undefined'
      } for secret ${secretId}`
    );
  }

  private async getTokenStatus(
    secretId: string,
    secretStage: string
  ): Promise<TokenStatus> {
    const currentAuthTokenString = await this.momentoSecrets.getSecret(
      secretId,
      undefined,
      secretStage
    );

    if (!currentAuthTokenString) {
      return TokenStatus.INVALID;
    }

    try {
      return await this.momentoRefresh.isValidAuthToken(
        SecretManagerTokenStore.fromString(currentAuthTokenString),
        secretStage
      );
    } catch (err) {
      console.log(err);
      return TokenStatus.INVALID;
    }
  }
}
