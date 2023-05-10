import {AuthTokenRefreshManager} from './auth-token-refresh-manager';

export const handler = async (
  event: any
): Promise<{
  statusCode: number,
  body: string
}> => {
  try {
    console.log(`Got rotation request, event: ${JSON.stringify(event)}`);
    const eventAsMap: Map<string, string> = new Map(Object.entries(event));

    const refreshManager = new AuthTokenRefreshManager();
    const response = await refreshManager.handleRotationRequest(eventAsMap);

    return {
      statusCode: 200,
      body: response,
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify(err),
    };
  }
};
