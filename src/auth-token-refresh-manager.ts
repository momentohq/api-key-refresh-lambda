import {ProcessTokenRefresh} from './process-token-refresh';

const USE_STUB_ENV_KEY = 'USE_STUB_KEY_VALUE';

export enum SecretCommandSteps {
  createSecret = 'Create',
  setSecret = 'Set',
  testSecret = 'Test',
  finishSecret = 'Finish',
}

export class AuthTokenRefreshManager {
  public static getEnv(): {
    useStub: boolean;
  } {
    const stubEnvValue = process.env[USE_STUB_ENV_KEY];
    return {
      useStub: stubEnvValue ? /^true$/i.test(stubEnvValue) : false,
    };
  }

  public static logAndThrow(message: string): never {
    console.error(message);
    throw new Error(message);
  }

  public async handleRotationRequest(
    event: Map<string, string>
  ): Promise<string> {
    const refreshToken = new ProcessTokenRefresh();

    if (this.isAutomaticRequest(event)) {
      console.log('Automatic rotation started.');
      const {secretId, requestToken, step} = this.parseAutomaticEvent(event);
      return await refreshToken.automaticRotation(secretId, requestToken, step);
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
    requestToken: string;
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
      AuthTokenRefreshManager.logAndThrow(
        `Event was malformed, SecretId: ${
          secretId ? secretId : 'null'
        }, ClientRequestToken: ${requestToken ? requestToken : 'null'}, Step: ${
          step ? step : 'null'
        }`
      );
    } else {
      return {
        secretId: secretId,
        requestToken: requestToken,
        step: stepAsEnum,
      };
    }
  }

  private parseManualEvent(event: Map<string, string>): {
    secretId: string;
  } {
    const secretId = event.get('SecretId');
    if (secretId === undefined) {
      AuthTokenRefreshManager.logAndThrow(
        `Event was malformed, SecretId: ${secretId ? secretId : 'null'}`
      );
    } else {
      return {
        secretId,
      };
    }
  }
}
