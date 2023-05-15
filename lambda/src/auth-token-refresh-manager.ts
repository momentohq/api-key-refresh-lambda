import {ProcessTokenRefresh} from './process-token-refresh';
import {Common} from './utils/common';
import {SecretCommandSteps} from './utils/secret-command-steps';

export class AuthTokenRefreshManager {
  public async handleRotationRequest(
    event: Map<string, string>
  ): Promise<string> {
    const refreshToken = new ProcessTokenRefresh();

    const {useStub, skipTestingStage, mockToken, mockTokenStatus} =
      Common.getEnv();

    console.log(
      `Env, useStub: ${useStub.toString()}, skipTestingStage: ${skipTestingStage.toString()}, mockToken: ${mockToken.toString()}, mockTokenStatus: ${mockTokenStatus.toString()}`
    );

    if (this.isAutomaticRequest(event)) {
      const {secretId, versionId, step} = this.parseAutomaticEvent(event);
      console.log(`${step.toString()}: Automatic rotation started.`);
      return await refreshToken.automaticRotation(secretId, versionId, step);
    } else {
      console.log('Manual rotation started.');
      const {secretId} = this.parseManualEvent(event);
      return await refreshToken.manualRotation(secretId);
    }
  }

  private isAutomaticRequest(event: Map<string, string>): boolean {
    return (
      event.has('SecretId') &&
      event.has('ClientRequestToken') &&
      event.has('Step')
    );
  }

  private parseAutomaticEvent(event: Map<string, string>): {
    secretId: string;
    versionId: string;
    step: SecretCommandSteps;
  } {
    const secretId = event.get('SecretId');
    const requestToken = event.get('ClientRequestToken');
    const step = event.get('Step');
    const stepAsEnum =
      SecretCommandSteps[step as keyof typeof SecretCommandSteps];
    if (
      secretId === undefined ||
      requestToken === undefined ||
      step === undefined ||
      stepAsEnum === undefined
    ) {
      Common.logAndThrow(
        `Event was malformed, SecretId: ${
          secretId ? secretId : 'null'
        }, ClientRequestToken: ${requestToken ? requestToken : 'null'}, Step: ${
          step ? step : 'null'
        }`
      );
    } else {
      return {
        secretId: secretId,
        versionId: requestToken,
        step: stepAsEnum,
      };
    }
  }

  private parseManualEvent(event: Map<string, string>): {
    secretId: string;
  } {
    const secretId = event.get('SecretId');
    if (secretId === undefined) {
      Common.logAndThrow(
        `Event was malformed, SecretId: ${secretId ? secretId : 'null'}`
      );
    } else {
      return {
        secretId,
      };
    }
  }
}
