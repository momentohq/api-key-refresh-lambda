import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import {InfrastructureStack} from '../lib/infrastructure-stack';

const DEFAULT_AUTO_ROTATION_IN_DAYS = '1'; // Rotate automatically in 1 days
const momentoAuthTokenSecretName: string | undefined =
  process.env.MOMENTO_AUTH_TOKEN_SECRET_NAME;
const autoRotationInDays: string =
  process.env.AUTO_ROTATION_IN_DAYS ?? DEFAULT_AUTO_ROTATION_IN_DAYS;
const kmsKeyArn: string | undefined = process.env.KMS_KEY_ARN;

const app = new cdk.App();
new InfrastructureStack(
  app,
  'momento-auth-token-refresh-stack',
  {
    env: {
      account:
        process.env.OVERRIDE_ACCOUNT_ID || process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.OVERRIDE_REGION || process.env.CDK_DEFAULT_REGION,
    },
  },
  {
    momentoAuthTokenSecretName: momentoAuthTokenSecretName,
    rotateAutomaticallyAfterInDays: parseInt(autoRotationInDays),
    kmsKeyArn: kmsKeyArn,
  }
);
