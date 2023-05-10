export interface MomentoSecrets {
  getSecret(
    secretId: string,
    versionId?: string,
    versionStage?: string
  ): Promise<string | undefined>;
  createSecret(
    secretId: string,
    secretValue: string | undefined,
    kmsKeyArn: string | undefined
  ): Promise<void>;
  describeSecret(secretId: string): Promise<Record<string, string[]>>;
  putSecret(
    secretId: string,
    newSecretString: string,
    requestToken?: string,
    versionStage?: string[]
  ): Promise<void>;
  updateVersionStage(
    secretId: string,
    versionStage: string,
    moveToVersionId: string,
    removeFromVersionId: string | undefined
  ): Promise<void>;
}
