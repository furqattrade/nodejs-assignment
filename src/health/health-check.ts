import { HealthCheckResult } from '@app-types';
import { config } from '@config';
import { HEALTH_STATUS } from '@constants';
import { QuoteRepository } from '@repositories/quote.repository';
import { ExternalQuotesService } from '@services/external-quotes.service';

export class HealthCheck {
  constructor(
    private externalService: ExternalQuotesService,
    private repository: QuoteRepository
  ) {}

  async check(): Promise<HealthCheckResult> {
    const apiStart = Date.now();
    let externalApi: HealthCheckResult['checks']['externalApi'];
    try {
      await this.externalService.fetchRandomQuote();
      externalApi = {
        status: HEALTH_STATUS.HEALTHY,
        latency: Date.now() - apiStart,
      };
    } catch (error) {
      externalApi = {
        status: HEALTH_STATUS.UNHEALTHY,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    const mem = process.memoryUsage();
    const totalMem = mem.heapTotal;
    const usedMem = mem.heapUsed;
    const percentage = (usedMem / totalMem) * 100;

    const memory: HealthCheckResult['checks']['memory'] = {
      status:
        percentage > 90
          ? HEALTH_STATUS.UNHEALTHY
          : percentage > 75
            ? HEALTH_STATUS.DEGRADED
            : HEALTH_STATUS.HEALTHY,
      used: usedMem,
      total: totalMem,
      percentage: Math.round(percentage),
    };

    let repository: HealthCheckResult['checks']['repository'];
    try {
      const count = this.repository.getCount();
      repository = {
        status: HEALTH_STATUS.HEALTHY,
        quotesCount: count,
      };
    } catch {
      repository = {
        status: HEALTH_STATUS.UNHEALTHY,
        quotesCount: 0,
      };
    }

    const checks: HealthCheckResult['checks'] = {
      externalApi,
      memory,
      repository,
    };

    const hasUnhealthy =
      memory.status === HEALTH_STATUS.UNHEALTHY || repository.status === HEALTH_STATUS.UNHEALTHY;
    const hasDegraded =
      memory.status === HEALTH_STATUS.DEGRADED ||
      repository.status === HEALTH_STATUS.DEGRADED ||
      externalApi.status === HEALTH_STATUS.UNHEALTHY;

    const result: HealthCheckResult = {
      status: hasUnhealthy
        ? HEALTH_STATUS.UNHEALTHY
        : hasDegraded
          ? HEALTH_STATUS.DEGRADED
          : HEALTH_STATUS.HEALTHY,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      checks,
    };

    return result;
  }
}
