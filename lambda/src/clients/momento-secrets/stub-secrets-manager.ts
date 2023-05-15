import {MomentoSecrets} from './momento-secrets';

export class MomentoStubSecretsManager implements MomentoSecrets {
  private readonly secretValueOverride: string;
  private readonly getVersionStageOverride: Record<string, string[]>;

  constructor(
    secretValueOverride: string,
    getVersionStageOverride: Record<string, string[]>
  ) {
    this.secretValueOverride = secretValueOverride;
    this.getVersionStageOverride = getVersionStageOverride;
  }

  async getSecret(
    secretId: string,
    versionId?: string,
    versionStage?: string
  ): Promise<string | undefined> {
    return this.secretValueOverride;
  }
  async createSecret(
    secretId: string,
    secretValue: string | undefined,
    kmsKeyArn: string | undefined
  ): Promise<void> {
    console.log('createSecret called');
  }
  async describeSecret(secretId: string): Promise<Record<string, string[]>> {
    return this.getVersionStageOverride;
  }
  async putSecret(
    secretId: string,
    newSecretString: string,
    requestToken?: string,
    versionStage?: string[]
  ): Promise<void> {
    console.log('putSecret called');
  }
  async updateVersionStage(
    secretId: string,
    versionStage: string,
    moveToVersionId: string | undefined,
    removeFromVersionId: string | undefined
  ): Promise<void> {
    console.log('updateVersionStage called');
  }
}
