# Momento Auth Token Refresh Lambda

This repo provides an example solution to manage and auto-refresh your Momento Authentication Tokens. This is done via a NodeJs 16 function deployed to your AWS account.

## Prerequisites

1. You have an AWS account
2. You have a Momento auth token, and you've stored it (in plaintext) in Secrets Manager
   1. If you haven't done so yet, you can create one with the following command:

```shell
aws secretsmanager create-secret --name "momento/authentication-token" --secret-string file://momento_token_info.json
```

If you are unsure where to get your auth token, one can be provided by [logging into the Momento console](https://console.gomomento.com/tokens) and generating one through the UI.

## Deploying to account

To deploy via CLI, follow the instructions here:

[DEVELOPMENT](./DEVELOPMENT.md)

### Manual rotation

With this lambda deployed you can also manually invoke your lambda to rotate a secret for you. Simply send an event with the following properties:

```json
{
  "momento_auth_token_secret_name": "<name of secret to rotate>"
}
```

## Retrieving auth token from secret manager

Your application simply needs to retrieve the newly-generated Secret from Secrets Manager. The secret name (unless overwritten) is `momento/authentication-token`, the token is stored in three key value parts, apiToken, refreshToken and validUntil.

The returned value will look similar to this:

```json
{
  "apiToken": "<jwt api token>",
  "refreshToken": "<refresh token>",
  "validUntil": "<epoch timestamp when token expires>"
}
```

Example using the AWS CLI and `jq`:

```shell
aws secretsmanager get-secret-value --secret-id "momento/authentication-token" | jq '.SecretString | fromjson'
{
  "apiToken": "<jwt api token>",
  "refreshToken": "<refresh token>",
  "validUntil": "<epoch timestamp when token expires>"
}
```
