<img src="https://docs.momentohq.com/img/logo.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-alpha.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)

# DEVELOPMENT

## Prerequisites

- Node 18+
- npm
- You have your Momento auth token stored away in Secrets Manager (see [README](./README.md) for instructions)

## How to update Momento SDK

Edit [lambda/package.json](./lambda/package.json) and edit this line:

```json
"@gomomento/sdk": "^1.18.0",
```

## How to build and deploy

- To deploy to your own account, run:

```shell
AWS_PROFILE=<YOUR_AWS_PROFILE_NAME> ./scripts/deploy.sh
```

Below is a list of optional environment variables you can pass in:

- `AUTO_ROTATION_IN_DAYS:` override the schedule (in days) in which the auth token will be refreshed. **Default:** 1 day
- `KMS_KEY_ARN`: override if you want to use your own KMS key to encrypt your secret in Secrets Manager. **Default:** `null`
- `MOMENTO_AUTH_TOKEN_SECRET_NAME`: override the name of the Secret created by the stack to store your auth token, multiple names can be added here separated by commas, this will allow the lambda to rotate multiple secrets. **Default:** `momento/authentication-token` **Example** `momento/auth-token-0,momento/auth-token-1`
- `SKIP_TEST_STEP_ENV_KEY_VALUE`: override if you want to skip the auth token testing, this will also disable CloudWatch Metrics. **Default:** `false`

Test environment variables

- `USE_STUB_KEY_VALUE`: override if you would like to stub out client responses, this is for testing purposes and no auth token will be refreshed while this is `true`. **Default:** `false`
- `MOCK_TOKEN_ENV_KEY_VALUE`: override if you would like to return a different mocked response from Secrets Manager for `getSecret` calls, requires `USE_STUB_KEY_VALUE` to be `true`. **Default:** `{}`
- `MOCK_TOKEN_STATUS_ENV_KEY_VALUE`: override if you would like to return a different mocked response for token status, this is to test cloudwatch Metrics, requires `USE_STUB_KEY_VALUE` to be `true`. **Default:** `[['AWSCURRENT', TokenStatus.VALID], ['AWSPENDING', TokenStatus.VALID]]`

## To tear down stack

```shell
AWS_PROFILE=<YOUR_AWS_PROFILE_NAME> ./scripts/teardown.sh
```

or delete the `momento-auth-token-refresh-stack` resource from CloudFormation manually.

---

For more info, visit our website at [https://gomomento.com](https://gomomento.com)!
