import {handler} from '../src/index';
import testEvent from './events/valid-test-event.json';
import createEvent from './events/valid-create-event.json';
import setEvent from './events/valid-set-event.json';
import finishEvent from './events/valid-finish-event.json';
import {AuthRefreshMetrics} from '../src/utils/auth-refresh-metrics';
import {SECRET_CURRENT, SECRET_PENDING} from '../src/utils/common';
import {TokenStatus} from '../src/utils/token-status';

describe('Auto Secret Rotation', () => {
  const USER_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.removeAllListeners();
    process.env = {...USER_ENV};
    process.env.USE_STUB_KEY_VALUE = 'true';
  });

  afterAll(() => {
    process.env = USER_ENV;
  });

  it('can createSecret', async () => {
    const response = await handler(createEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('Create: Success');
  });

  it("can't createSecret with invalid token in secrets manager", async () => {
    process.env['MOCK_TOKEN_ENV_KEY_VALUE'] = 'this is not be a valid token';

    const response = await handler(createEvent);

    expect(response.statusCode).toBe(500);
  });

  it('can setSecret', async () => {
    const response = await handler(setEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('Set: no-op');
  });

  it('can testSecret - Skip testing', async () => {
    process.env['SKIP_TEST_STEP_ENV_KEY_VALUE'] = 'true';
    const response = await handler(testEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('Test: no-op');
  });

  it('can finishSecret', async () => {
    const response = await handler(finishEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('Finish: Success');
  });

  it('testSecret does not emits cloudwatch metric on VALID', async () => {
    process.env['MOCK_TOKEN_STATUS_ENV_KEY_VALUE'] = JSON.stringify(
      Array.from(
        new Map<string, TokenStatus>([
          [SECRET_PENDING, TokenStatus.VALID],
        ]).entries()
      )
    );

    const response = await handler(testEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('Test: Success');
  });

  it('testSecret emits cloudwatch metric on NOT_TESTED', async () => {
    process.env['MOCK_TOKEN_STATUS_ENV_KEY_VALUE'] = JSON.stringify(
      Array.from(
        new Map<string, TokenStatus>([
          [SECRET_PENDING, TokenStatus.NOT_TESTED],
        ]).entries()
      )
    );

    process.once(
      'message',
      (data: {metricName: string; secretId: string; versionId: string}) => {
        expect(data.metricName).toBe(AuthRefreshMetrics.FailToTest);
        expect(data.secretId).toBe(
          'arn:aws:secretsmanager:us-west-2:123456789012:secret:foo/bar/baz'
        );
        expect(data.versionId).toBe(SECRET_PENDING);
      }
    );

    const response = await handler(testEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('Test: Success');
  });

  it('testSecret emits cloudwatch metric on INVALID, then NOT_TESTED for current token', async () => {
    process.env['MOCK_TOKEN_STATUS_ENV_KEY_VALUE'] = JSON.stringify(
      Array.from(
        new Map<string, TokenStatus>([
          [SECRET_PENDING, TokenStatus.INVALID],
          [SECRET_CURRENT, TokenStatus.NOT_TESTED],
        ]).entries()
      )
    );

    process.once(
      'message',
      (data: {metricName: string; secretId: string; versionId: string}) => {
        expect(data.metricName).toBe(AuthRefreshMetrics.FailedToRefreshToken);
        expect(data.secretId).toBe(
          'arn:aws:secretsmanager:us-west-2:123456789012:secret:foo/bar/baz'
        );
        expect(data.versionId).toBe(SECRET_PENDING);
      }
    );

    process.once(
      'message',
      (data: {metricName: string; secretId: string; versionId: string}) => {
        expect(data.metricName).toBe(AuthRefreshMetrics.FailToTest);
        expect(data.secretId).toBe(
          'arn:aws:secretsmanager:us-west-2:123456789012:secret:foo/bar/baz'
        );
        expect(data.versionId).toBe(SECRET_CURRENT);
      }
    );

    const response = await handler(testEvent);

    expect(response.statusCode).toBe(500);
  });

  it('testSecret emits cloudwatch metric on INVALID for both token stage checks', async () => {
    process.env['MOCK_TOKEN_STATUS_ENV_KEY_VALUE'] = JSON.stringify(
      Array.from(
        new Map<string, TokenStatus>([
          [SECRET_CURRENT, TokenStatus.INVALID],
          [SECRET_PENDING, TokenStatus.INVALID],
        ]).entries()
      )
    );

    process.once(
      'message',
      (data: {metricName: string; secretId: string; versionId: string}) => {
        expect(data.metricName).toBe(AuthRefreshMetrics.NoValidTokens);
        expect(data.secretId).toBe(
          'arn:aws:secretsmanager:us-west-2:123456789012:secret:foo/bar/baz'
        );
        expect(data.versionId).toBe(SECRET_CURRENT);
      }
    );

    process.once(
      'message',
      (data: {metricName: string; secretId: string; versionId: string}) => {
        expect(data.metricName).toBe(AuthRefreshMetrics.NoValidTokens);
        expect(data.secretId).toBe(
          'arn:aws:secretsmanager:us-west-2:123456789012:secret:foo/bar/baz'
        );
        expect(data.versionId).toBe(SECRET_CURRENT);
      }
    );

    const response = await handler(testEvent);

    expect(response.statusCode).toBe(500);
  });

  it('testSecret emits cloudwatch metric on INVALID for pending stage check', async () => {
    process.env['MOCK_TOKEN_ENV_KEY_VALUE'] = JSON.stringify(
      Array.from(
        new Map<string, TokenStatus>([
          [SECRET_CURRENT, TokenStatus.INVALID],
          [SECRET_PENDING, TokenStatus.VALID],
        ]).entries()
      )
    );

    process.once(
      'message',
      (data: {metricName: string; secretId: string; versionId: string}) => {
        expect(data.metricName).toBe(AuthRefreshMetrics.FailedToRefreshToken);
        expect(data.secretId).toBe(
          'arn:aws:secretsmanager:us-west-2:123456789012:secret:foo/bar/baz'
        );
        expect(data.versionId).toBe(SECRET_PENDING);
      }
    );

    const response = await handler(testEvent);

    expect(response.statusCode).toBe(200);
  });
});
