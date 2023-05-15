import {AuthRefreshMetrics} from '../../utils/auth-refresh-metrics';

export interface MomentoCloudWatch {
  emitMetric(
    metricName: AuthRefreshMetrics,
    secretId: string,
    versionId: string
  ): Promise<void>;
}
