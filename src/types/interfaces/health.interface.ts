import { HealthStatus } from '@constants';

export interface HealthCheckResult {
  readonly status: HealthStatus;
  readonly timestamp: string;
  readonly uptime: number;
  readonly environment: string;
  readonly checks: {
    readonly externalApi: {
      readonly status: string;
      readonly latency?: number;
      readonly error?: string;
    };
    readonly memory: {
      readonly status: string;
      readonly used: number;
      readonly total: number;
      readonly percentage: number;
    };
    readonly repository: { readonly status: string; readonly quotesCount: number };
  };
}
