<img src="https://docs.momentohq.com/img/logo.svg" alt="logo" width="400"/>

[![project status](https://momentohq.github.io/standards-and-practices/badges/project-status-official.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md)
[![project stability](https://momentohq.github.io/standards-and-practices/badges/project-stability-alpha.svg)](https://github.com/momentohq/standards-and-practices/blob/main/docs/momento-on-github.md) 


# Momento api key refresh using an AWS Lambda function

This repo provides an example solution to manage and auto-refresh Momento authentication tokens for best security practices. This is done via a Node.js&reg; 16 function deployed to AWS Lambda in your AWS account.

## Prerequisites

1. An AWS account with a role which can run AWS CDK
2. A Momento api key downloaded from the [Momento console](https://console.gomomento.com/tokens) to a JSON file.

If you need a Momento api key, [log into the Momento console](https://console.gomomento.com/tokens) and generate one using the UI.

Instructions on how to generate your token can be found [in our public docs](https://docs.momentohq.com/getting-started#step-2-create-an-authentication-token-in-the-momento-console).

The generated result should be downloaded as a JSON file for safe keeping, named `momento_token.info.json`. Open this fil The contents of the downloaded JSON file will look like:

```json
{
  "apiKey": "<jwt api key>",
  "refreshToken": "<refresh token>",
  "validUntil": "<epoch timestamp when token expires>"
}
```

## Deploying the Lambda function to an AWS account

Using the command line; deploy the function, IAM role, api key, etc., via CLI, with the following instructions:

[DEPLOYMENT](./DEPLOYMENT.md)

### Manual rotation

With the Lambda function in this repo deployed, you can manually invoke the Lambda function to rotate a secret for you. Simply send an event with the following properties:

```json
{
  "momento_auth_token_secret_name": "momento/authentication-token"
}
```

If you've overriden the default secret name, then replace `momento/authentication-token` with your custom name.

## Retrieving api key from secret manager

Your application simply needs to retrieve the newly-generated secret from AWS Secrets Manager. The secret name (unless overwritten) is `momento/authentication-token`, the token is stored in three key value parts, apiKey, refreshToken, and validUntil.

Example using the AWS CLI and `jq`:

```shell
aws secretsmanager get-secret-value --secret-id "momento/authentication-token" | jq '.SecretString | fromjson'
{
  "apiKey": "<jwt api key>",
  "refreshToken": "<refresh token>",
  "validUntil": "<epoch timestamp when token expires>"
}
```

----------------------------------------------------------------------------------------
For more info, visit our website at [https://gomomento.com](https://gomomento.com)!
