import {CloudWatch} from '@aws-sdk/client-cloudwatch';
import {MomentoCloudWatch} from './momento-cloudwatch';
import {AuthRefreshMetrics} from '../../utils/auth-refresh-metrics';

export class MomentoCloudWatchManger implements MomentoCloudWatch {
  private readonly cloudwatch: CloudWatch;

  constructor(cloudwatch: CloudWatch) {
    this.cloudwatch = cloudwatch;
  }

  async emitMetric(
    metricName: AuthRefreshMetrics,
    secretId: string,
    versionId: string
  ): Promise<void> {
    await this.cloudwatch.putMetricData({
      Namespace: 'Momento/AuthTokenRefreshLambda',
      MetricData: [
        {
          MetricName: metricName.toString(),
          Dimensions: [
            {
              Name: 'SecretId',
              Value: secretId,
            },
            {
              Name: 'Stage',
              Value: versionId,
            },
          ],
          Value: 1,
        },
      ],
    });
  }
}
