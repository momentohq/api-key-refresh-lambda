import {SecretsManager} from '@aws-sdk/client-secrets-manager';
import {MomentoSecrets} from './momento-secrets';

export class MomentoSecretsManager implements MomentoSecrets {
  private readonly awsSecretsManager: SecretsManager;

  constructor(secretsManager: SecretsManager) {
    this.awsSecretsManager = secretsManager;
  }

  async getSecret(
    secretId: string,
    versionId?: string,
    versionStage?: string
  ): Promise<string | undefined> {
    const getResponse = await this.awsSecretsManager.getSecretValue({
      SecretId: secretId,
      VersionId: versionId,
      VersionStage: versionStage,
    });
    return getResponse.SecretString;
  }
  async createSecret(
    secretId: string,
    secretValue: string | undefined,
    kmsKeyArn: string | undefined
  ): Promise<void> {
    await this.awsSecretsManager.createSecret({
      Name: secretId,
      SecretString: secretValue,
      KmsKeyId: kmsKeyArn,
    });
  }
  async describeSecret(secretId: string): Promise<Record<string, string[]>> {
    const getVersionResponse = await this.awsSecretsManager.describeSecret({
      SecretId: secretId,
    });
    if (getVersionResponse.VersionIdsToStages === undefined) {
      throw new Error('No versions for secret ${secretId}');
    }
    return getVersionResponse.VersionIdsToStages;
  }
  async putSecret(
    secretId: string,
    newSecretString: string,
    requestToken?: string,
    versionStage?: string[]
  ): Promise<void> {
    await this.awsSecretsManager.putSecretValue({
      SecretId: secretId,
      SecretString: newSecretString,
      VersionStages: versionStage,
      ClientRequestToken: requestToken,
    });
  }
  async updateVersionStage(
    secretId: string,
    versionStage: string,
    moveToVersionId: string,
    removeFromVersionId: string | undefined
  ): Promise<void> {
    await this.awsSecretsManager.updateSecretVersionStage({
      SecretId: secretId,
      VersionStage: versionStage,
      MoveToVersionId: moveToVersionId,
      RemoveFromVersionId: removeFromVersionId,
    });
  }
}
