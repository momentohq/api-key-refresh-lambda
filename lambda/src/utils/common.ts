import {TokenStatus} from './token-status';

export const SECRET_CURRENT = 'AWSCURRENT';
export const SECRET_PENDING = 'AWSPENDING';

const USE_STUB = 'USE_STUB_KEY_VALUE';
const MOCK_TOKEN = 'MOCK_TOKEN_ENV_KEY_VALUE';
const MOCK_TOKEN_STATUS = 'MOCK_TOKEN_STATUS_ENV_KEY_VALUE';
const SKIP_TEST_STEP = 'SKIP_TEST_STEP_ENV_KEY_VALUE';

export class Common {
  public static getEnv(): {
    useStub: boolean;
    skipTestingStage: boolean;
    mockToken: string;
    mockTokenStatus: Map<string, TokenStatus>;
  } {
    const useStub = this.getBooleanEnv(USE_STUB, false);
    const skipTestingStage = this.getBooleanEnv(SKIP_TEST_STEP, false);
    const mockToken = this.parseStringEnv(MOCK_TOKEN, '{}');
    const mockTokenStatus = this.parseTokenStatusEnv(
      new Map<string, TokenStatus>([
        [SECRET_CURRENT, TokenStatus.VALID],
        [SECRET_PENDING, TokenStatus.VALID],
      ])
    );
    return {
      useStub,
      skipTestingStage,
      mockToken,
      mockTokenStatus,
    };
  }

  private static getBooleanEnv(
    envVar: string,
    defaultSetting: boolean
  ): boolean {
    const envVarBool = process.env[envVar];
    if (!envVarBool) {
      return defaultSetting;
    }
    return /^true$/i.test(envVarBool);
  }

  private static parseStringEnv(
    envVar: string,
    defaultSetting: string
  ): string {
    const envVarString = process.env[envVar];
    if (!envVarString) {
      return defaultSetting;
    }
    return envVarString;
  }

  private static parseTokenStatusEnv(
    defaultSetting: Map<string, TokenStatus>
  ): Map<string, TokenStatus> {
    const envVarMap = process.env[MOCK_TOKEN_STATUS];
    if (!envVarMap) {
      return defaultSetting;
    }
    return new Map(JSON.parse(envVarMap) as Map<string, TokenStatus>);
  }

  public static logAndThrow(message: string): never {
    console.error(message);
    throw new Error(message);
  }

  public static logErrorAndRethrow(message: string, error: unknown): never {
    console.error(message, error);
    throw error;
  }
}
