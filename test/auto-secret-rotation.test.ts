import {handler} from '../src/index';
import createEvent from './events/valid-create-event.json';
import setEvent from './events/valid-set-event.json';
import testEvent from './events/valid-test-event.json';
import finishEvent from './events/valid-finish-event.json';

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

  it('can createSecret', async () => {
    const response = await handler(createEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('Create: Success');
  });

  it('can setSecret', async () => {
    const response = await handler(setEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('Set: no-op');
  });

  it('can testSecret', async () => {
    const response = await handler(testEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('Test: no-op');
  });

  it('can finishSecret', async () => {
    const response = await handler(finishEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBe('Finish: Success');
  });
});
