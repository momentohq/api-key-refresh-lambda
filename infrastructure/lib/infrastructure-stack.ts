import * as cdk from 'aws-cdk-lib';
import {Duration, Fn} from 'aws-cdk-lib';
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
import {randomUUID} from 'crypto';

interface AuthTokenOptions {
  // The name you would like to give to the Secret containing your Momento auth token, 
  // multiple secrets can be refreshed by adding a comma spliced list
  momentoAuthTokenSecretName?: string[];
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

    const authTokenNames = this.getAuthTokenSecretNames(authTokenOptions.momentoAuthTokenSecretName)
    let momentoAuthTokenSecret: Map<string, secretsmanager.Secret> = new Map<string, secretsmanager.Secret>();

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
    authTokenNames.forEach((name: string) => {
      if (authTokenOptions.kmsKeyArn !== undefined) {
        lambdaRole.addToPolicy(
          new PolicyStatement({
            effect: Effect.ALLOW,
            actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
            resources: [authTokenOptions.kmsKeyArn],
          })
        );
        momentoAuthTokenSecret.set(name, new secretsmanager.Secret(
          this,
          `momento-auth-token-secret-${name}}`,
          {
            secretName: name,
            encryptionKey: kms.Key.fromKeyArn(
              this,
              'secret-kms-key',
              authTokenOptions.kmsKeyArn
            ),
          }
        ));
      } else {
        momentoAuthTokenSecret.set(name, new secretsmanager.Secret(
          this,
          `momento-auth-token-secret-${name}`,
          {
            secretName: name,
          }
        ));
      }
    });

    lambdaRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          'secretsmanager:GetSecretValue',
          'secretsmanager:CreateSecret',
          'secretsmanager:PutSecretValue',
          'secretsmanager:DescribeSecret',
          'secretsmanager:UpdateversionIdStage',
        ],
        resources: this.getSecretArns(authTokenNames),
      })
    );
    lambdaRole.addToPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: this.getSecretArns(authTokenNames),
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
        runtime: lambda.Runtime.NODEJS_18_X,
        entry: path.join(__dirname, '/../../lambda/src/index.ts'),
        projectRoot: path.join(__dirname, '/../../lambda/'),
        depsLockFilePath: path.join(__dirname, '/../../lambda/package-lock.json'),
        handler: 'handler',
        functionName: 'momento-auth-token-refresh-lambda',
        timeout: Duration.seconds(60),
        memorySize: 128,
        role: lambdaRole,
      }
    );

    func.grantInvoke(new iam.ServicePrincipal('secretsmanager.amazonaws.com'));

    momentoAuthTokenSecret.forEach((secret, name) => {
      secret.addRotationSchedule(`auth-token-refresh-schedule-for-${name}`, {
        rotationLambda: func,
        automaticallyAfter: Duration.days(
          authTokenOptions.rotateAutomaticallyAfterInDays
        ),
      });
    });
  }

  private getAuthTokenSecretNames(secretNames?: string[]): string[] {
    return (secretNames && secretNames.length !== 0) ? secretNames : ['momento/authentication-token']
  }

  private getSecretArns(secretNames: string[]): string[] {
    return secretNames.map((names: string) => {
      return Fn.sub('arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:' + names + '*')
    });
  }
}
