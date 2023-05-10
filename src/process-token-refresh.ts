import {ResourceNotFoundException} from '@aws-sdk/client-secrets-manager';
import {SecretManagerTokenStore} from './models/secret-manager-token';
import {MomentoSecrets} from './clients/momento-secrets/momento-secrets';
import {MomentoRefresh} from './clients/momento-refresh/momento-refresh';
import {ClientFactory} from './clients/client-factory';
import {
  AuthTokenRefreshManager,
  SecretCommandSteps,
} from './auth-token-refresh-manager';

const SECRET_CURRENT = 'AWSCURRENT';
const SECRET_PENDING = 'AWSPENDING';

export class ProcessTokenRefresh {
  private readonly momentoSecrets: MomentoSecrets;
  private readonly momentoRefresh: MomentoRefresh;

  constructor() {
    const {useStub} = AuthTokenRefreshManager.getEnv();
    this.momentoSecrets = ClientFactory.getMomentoSecretsManager(useStub);
    this.momentoRefresh = ClientFactory.getMomentoRefreshManager(useStub);
  }

  public async manualRotation(secretId: string): Promise<string> {
    let currentApiToken = undefined;
    try {
      currentApiToken = await this.momentoSecrets.getSecret(
        secretId,
        undefined,
        undefined
      );
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        console.error(
          `Failed to find secret. Please create a new secret at this arn, ${secretId}, api key can be generated through momento console.`
        );
        throw error;
      } else {
        throw error;
      }
    }

    if (!currentApiToken) {
      AuthTokenRefreshManager.logAndThrow('Failed to get a valid');
    }

    const currentToken = SecretManagerTokenStore.fromString(currentApiToken);
    const newTokenResponse = await this.momentoRefresh.refreshApiToken(
      currentToken
    );
    const newTokenStore =
      SecretManagerTokenStore.fromRefreshApiTokenResponse(newTokenResponse);

    await this.momentoSecrets.putSecret(
      secretId,
      newTokenStore.toString(),
      undefined,
      undefined
    );
    console.log(`Successfully rotated authentication token for ${secretId}.`);
    return 'ManualRotation: Success';
  }

  public async automaticRotation(
    secretId: string,
    requestToken: string,
    step: SecretCommandSteps
  ): Promise<string> {
    const secretMetadata = await this.momentoSecrets.describeSecret(secretId);

    if (!secretMetadata[requestToken]) {
      AuthTokenRefreshManager.logAndThrow(
        `Secret version ${requestToken} has no stage for rotation of secret ${secretId}.`
      );
    }
    if (secretMetadata[requestToken].includes(SECRET_CURRENT)) {
      console.log(
        `Secret version ${requestToken} is AWSCURRENT for rotation of secret ${secretId}, nothing to do.`
      );
      return 'Rotation: no-op';
    } else if (!secretMetadata[requestToken].includes(SECRET_PENDING)) {
      AuthTokenRefreshManager.logAndThrow(
        `Secret version ${requestToken} not set as AWSPENDING for rotation of secret ${secretId}`
      );
    }

    return await this.rotationRequestHandler(step, secretId, requestToken);
  }

  private async rotationRequestHandler(
    step: SecretCommandSteps,
    secretId: string,
    requestToken: string
  ): Promise<string> {
    switch (step) {
      case SecretCommandSteps.createSecret:
        await this.createSecret(secretId, requestToken);
        return `${SecretCommandSteps.createSecret.toString()}: Success`;
      case SecretCommandSteps.setSecret:
        return `${SecretCommandSteps.setSecret.toString()}: no-op`;
      case SecretCommandSteps.testSecret:
        return `${SecretCommandSteps.testSecret.toString()}: no-op`;
      case SecretCommandSteps.finishSecret:
        await this.finishSecret(secretId, requestToken);
        return `${SecretCommandSteps.finishSecret.toString()}: Success`;
    }
  }

  private async createSecret(
    secretId: string,
    requestToken: string
  ): Promise<void> {
    const currentApiTokenString = await this.momentoSecrets.getSecret(
      secretId,
      undefined,
      SECRET_CURRENT
    );
    if (!currentApiTokenString) {
      AuthTokenRefreshManager.logAndThrow('Could not get valid secret');
    }

    const currentToken = SecretManagerTokenStore.fromString(
      currentApiTokenString
    );

    try {
      await this.momentoSecrets.getSecret(
        secretId,
        requestToken,
        SECRET_PENDING
      );
      console.log(
        `${SecretCommandSteps.createSecret.toString()}: Successfully retrieved secret for ${secretId}.`
      );
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        const refreshApiTokenResponse =
          await this.momentoRefresh.refreshApiToken(currentToken);
        const newTokenStore =
          SecretManagerTokenStore.fromRefreshApiTokenResponse(
            refreshApiTokenResponse
          );

        await this.momentoSecrets.putSecret(
          secretId,
          newTokenStore.toString(),
          requestToken,
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

  private async finishSecret(
    secretId: string,
    requestToken: string
  ): Promise<void> {
    const versions: Record<string, string[]> =
      await this.momentoSecrets.describeSecret(secretId);

    let currentVersion = undefined;
    for (const item in versions) {
      if (versions[item].includes(SECRET_CURRENT)) {
        if (requestToken === item) {
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
      requestToken,
      currentVersion
    );
    console.log(
      `${SecretCommandSteps.finishSecret.toString()}: Successfull set ${SECRET_CURRENT} stage to version ${requestToken} for secret ${secretId}`
    );
  }
}
