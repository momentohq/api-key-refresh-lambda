import {AuthRefreshMetrics} from '../../utils/auth-refresh-metrics';
import {MomentoCloudWatch} from './momento-cloudwatch';

export class MomentoStubCloudWatchManger implements MomentoCloudWatch {

  async emitMetric(metricName: AuthRefreshMetrics, secretId: string, versionId: string): Promise<void> {
    process.emit('message', {
      metricName: metricName.toString(),
      secretId: secretId,
      versionId: versionId
    }, undefined);
  }
}
