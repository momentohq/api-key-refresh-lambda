<img src="https://docs.momentohq.com/img/logo.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-alpha.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)

# DEVELOPMENT

## Prerequisites

- [Node.js&reg;](https://nodejs.org/) v16+
- [Node Package Manager (npm)](https://www.npmjs.com/)
- A Momento api key JSON file created in the [Momento console](https://console.gomomento.com/tokens)
- AWS [command line tools](https://aws.amazon.com/cli/)

## How to update Momento Javascript SDK

Edit [lambda/package.json](./lambda/package.json) and edit this line:

```json
"@gomomento/sdk": "^1.18.0",
```

## How to build and deploy

- To deploy to your own account, run:

```shell
AWS_PROFILE=<YOUR_AWS_PROFILE_NAME> ./scripts/deploy.sh
```

Below is a list of optional environment variables you can pass in to deploy.sh:

- `AUTO_ROTATION_IN_DAYS:` override the schedule (in days) in which the api key will be refreshed. **Default:** 1 day
- `KMS_KEY_ARN`: override if you want to use your own KMS key to encrypt your secret in Secrets Manager. **Default:** `null`
- `MOMENTO_AUTH_TOKEN_SECRET_NAME`: override the name of the Secret created by the stack to store your api key, multiple names can be added here separated by commas, this will allow the lambda to rotate multiple secrets. **Default:** `momento/authentication-token` **Example** `momento/auth-token-0,momento/auth-token-1`
- `SKIP_TEST_STEP_ENV_KEY_VALUE`: override if you want to skip the api key testing, this will also disable CloudWatch Metrics. **Default:** `false`

Test environment variables

- `USE_STUB_KEY_VALUE`: override if you would like to stub out client responses, this is for testing purposes and no api key will be refreshed while this is `true`. **Default:** `false`
- `MOCK_TOKEN_ENV_KEY_VALUE`: override if you would like to return a different mocked response from Secrets Manager for `getSecret` calls, requires `USE_STUB_KEY_VALUE` to be `true`. **Default:** `{}`
- `MOCK_TOKEN_STATUS_ENV_KEY_VALUE`: override if you would like to return a different mocked response for token status, this is to test cloudwatch Metrics, requires `USE_STUB_KEY_VALUE` to be `true`. **Default:** `[['AWSCURRENT', TokenStatus.VALID], ['AWSPENDING', TokenStatus.VALID]]`

Upon completion of deployment, your secrets will be created in AWS Secret Manager, however, they now need to be populated. This can be done through AWS Secrets Manager console, or through the aws cli.

For more info on what needs to be stored and where to get the token, checkout the [README](./README.md) `Prerequisites` section.

The JSON api key file can then be used to create a secret in AWS secret manager, like so

```shell
aws secretsmanager create-secret --name "momento/authentication-token" --secret-string file://momento_token_info.json
```

this will need to be done for each secrets listed in `MOMENTO_AUTH_TOKEN_SECRET_NAME`.

For more information on creating AWS secrets, checkout [AWS Secrets Managers guide](https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_secret.html).

## To tear down stack

```shell
AWS_PROFILE=<YOUR_AWS_PROFILE_NAME> ./scripts/teardown.sh
```

or delete the `momento-auth-token-refresh-stack` resource from CloudFormation manually.

---

For more info, visit our website at [https://gomomento.com](https://gomomento.com)!
