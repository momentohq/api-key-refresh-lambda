<img src="https://docs.momentohq.com/img/logo.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-alpha.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md) 


# Momento Auth Token Refresh Lambda

This repo provides an example solution to manage and auto-refresh your Momento Authentication Tokens. This is done via a NodeJs 16 function deployed to your AWS account.

## Prerequisites

1. You have an AWS account
2. You have a Momento auth token

If you are unsure where to get your auth token, one can be provided by [logging into the Momento console](https://console.gomomento.com/tokens) and generating one through the UI.

Instructions on how to generate your token can be found [here in our public docs](https://docs.momentohq.com/getting-started#step-2-create-an-authentication-token-in-the-momento-console).

The generated result can be downloaded as a JSON file, named `momento_token.info.json`, the contents will look like,

```json
{
  "authToken": "<jwt auth token>",
  "refreshToken": "<refresh token>",
  "validUntil": "<epoch timestamp when token expires>"
}
```

## Deploying to account

To deploy via CLI, follow the instructions here:

[DEPLOYMENT](./DEPLOYMENT.md)

### Manual rotation

With this lambda deployed you can also manually invoke your lambda to rotate a secret for you. Simply send an event with the following properties:

```json
{
  "momento_auth_token_secret_name": "momento/authentication-token"
}
```

If you've overriden the default secret name, then replace `momento/authentication-token` with your custom name.

## Retrieving auth token from secret manager

Your application simply needs to retrieve the newly-generated Secret from Secrets Manager. The secret name (unless overwritten) is `momento/authentication-token`, the token is stored in three key value parts, authToken, refreshToken and validUntil.

Example using the AWS CLI and `jq`:

```shell
aws secretsmanager get-secret-value --secret-id "momento/authentication-token" | jq '.SecretString | fromjson'
{
  "authToken": "<jwt auth token>",
  "refreshToken": "<refresh token>",
  "validUntil": "<epoch timestamp when token expires>"
}
```

----------------------------------------------------------------------------------------
For more info, visit our website at [https://gomomento.com](https://gomomento.com)!
