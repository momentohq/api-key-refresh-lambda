{{ ossHeader }}

# Momento Auth Token Refresh Lambda

This repo provides an example solution to manage and auto-refresh your Momento Authentication Tokens. This is done via a NodeJs 16 function deployed to your AWS account.

## Prerequisites

1. You have an AWS account
2. You have a Momento auth token, and you've stored it (in plaintext) in Secrets Manager

If you are unsure where to get your auth token, one can be provided by [logging into the Momento console](https://console.gomomento.com/tokens) and generating one through the UI.

Instructions on how to generate your token can be found [here in our public docs](https://docs.momentohq.com/getting-started#step-2-create-an-authentication-token-in-the-momento-console).

The generated result can be downloaded as a JSON file, named `momento_token.info.json`, the contents will look like,

```json
{
  "apiToken": "<jwt api token>",
  "refreshToken": "<refresh token>",
  "validUntil": "<epoch timestamp when token expires>"
}
```

This json file can then be used to create a secret in AWS secret manager, like so

```shell
aws secretsmanager create-secret --name "momento/authentication-token" --secret-string file://momento_token_info.json
```

for more information on creating AWS secrets, checkout [AWS Secrets Managers guide](https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_secret.html).

## Deploying to account

To deploy via CLI, follow the instructions here:

[DEVELOPMENT](./DEVELOPMENT.md)

### Manual rotation

With this lambda deployed you can also manually invoke your lambda to rotate a secret for you. Simply send an event with the following properties:

```json
{
  "momento_auth_token_secret_name": "momento/authentication-token"
}
```

If you've overriden the default secret name, then replace `momento/authentication-token` with your custom name.

## Retrieving auth token from secret manager

Your application simply needs to retrieve the newly-generated Secret from Secrets Manager. The secret name (unless overwritten) is `momento/authentication-token`, the token is stored in three key value parts, apiToken, refreshToken and validUntil.

Example using the AWS CLI and `jq`:

```shell
aws secretsmanager get-secret-value --secret-id "momento/authentication-token" | jq '.SecretString | fromjson'
{
  "apiToken": "<jwt api token>",
  "refreshToken": "<refresh token>",
  "validUntil": "<epoch timestamp when token expires>"
}
```

{{ ossFooter }}
