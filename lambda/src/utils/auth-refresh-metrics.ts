export enum AuthRefreshMetrics {
  FailToTest = 'failed_to_test_api_token', // info
  FailedToRefreshToken = 'failed_to_refresh_api_token', // warn
  NoValidTokens = 'no_valid_tokens', // error
}
