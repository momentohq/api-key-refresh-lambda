import * as cdk from 'aws-cdk-lib';
import {Duration} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import {
  Effect,
  ManagedPolicy,
  PolicyStatement,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import {NodejsFunction} from 'aws-cdk-lib/aws-lambda-nodejs';
import path = require('path');

interface AuthTokenOptions {
  // The name you would like to give to the Secret containing your Momento auth token
  momentoAuthTokenSecretName?: string;
  // Override this if you wish to change when the secret is automatically rotated.
  rotateAutomaticallyAfterInDays: number;
  // Override this if you are not using the default AWS KMS key for your secret
  kmsKeyArn?: string;
}

export class InfrastructureStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    stackProps: cdk.StackProps,
    authTokenOptions: AuthTokenOptions
  ) {
    super(scope, id, stackProps);

    const authTokenName = authTokenOptions.momentoAuthTokenSecretName
      ? authTokenOptions.momentoAuthTokenSecretName
      : 'momento/authentication-token';
    let momentoAuthTokenSecret: secretsmanager.Secret;

    const lambdaRole = new iam.Role(
      this,
      'momento-auth-token-refresh-lambda-role',
      {
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          ManagedPolicy.fromManagedPolicyArn(
            this,
            'momento-auth-token-refresh-policy',
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
      }
    );
    if (authTokenOptions.kmsKeyArn !== undefined) {
      lambdaRole.addToPolicy(
        new PolicyStatement({
          effect: Effect.ALLOW,
          actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
          resources: [authTokenOptions.kmsKeyArn],
        })
      );
      momentoAuthTokenSecret = new secretsmanager.Secret(
        this,
        'momento-auth-token-secret',
        {
          secretName: authTokenName,
          encryptionKey: kms.Key.fromKeyArn(
            this,
            'secret-kms-key',
            authTokenOptions.kmsKeyArn
          ),
        }
      );
    } else {
      momentoAuthTokenSecret = new secretsmanager.Secret(
        this,
        'momento-auth-token-secret',
        {
          secretName: authTokenName,
        }
      );
    }
    lambdaRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:CreateSecret',
          'secretsmanager:PutSecretValue',
          'secretsmanager:DescribeSecret',
          'secretsmanager:UpdateSecretVersionStage',
        ],
        resources: ['*'],
      })
    );
    lambdaRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: ['*'],
      })
    );

    lambdaRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
      })
    );
    const func = new NodejsFunction(
      this,
      'momento-auth-token-refresh-lambda',
      {
        runtime: lambda.Runtime.NODEJS_16_X,
        entry: path.join(__dirname, '/../../src/index.ts'),
        projectRoot: path.join(__dirname, '/../..'),
        depsLockFilePath: path.join(__dirname, '/../../package-lock.json'),
        handler: 'handler',
        functionName: 'momento-auth-token-refresh-lambda',
        timeout: Duration.seconds(60),
        memorySize: 128,
        role: lambdaRole,
      }
    );

    func.grantInvoke(new iam.ServicePrincipal('secretsmanager.amazonaws.com'));

    momentoAuthTokenSecret.addRotationSchedule('auth-token-refresh-schedule', {
      rotationLambda: func,
      automaticallyAfter: Duration.days(
        authTokenOptions.rotateAutomaticallyAfterInDays
      ),
    });
  }
}
