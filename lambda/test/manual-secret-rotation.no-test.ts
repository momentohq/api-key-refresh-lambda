import {handler} from '../src/index';
import validManualEvent from './events/valid-manual-event.json';
import invalidManualEvent from './events/invalid-manual-event.json';

describe('Auto Secret Rotation', () => {
  const USER_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {...USER_ENV};
    process.env.USE_STUB_KEY_VALUE = 'true';
  });

  afterAll(() => {
    process.env = USER_ENV;
  });

  it('can run manual rotation', async () => {
    const response = await handler(validManualEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('ManualRotation: Success');
  });

  it('fail run manual rotation for invalid event', async () => {
    const response = await handler(invalidManualEvent);

    expect(response.statusCode).toBe(500);
  });
});
