import https from 'https';

import axios, { AxiosError, AxiosInstance, isAxiosError } from 'axios';
import axiosRetry, { exponentialDelay, isNetworkOrIdempotentRequestError } from 'axios-retry';
import CircuitBreaker from 'opossum';

import { ExternalQuote } from '@app-types';
import { config } from '@config';
import { API_CONSTANTS } from '@constants';
import { logger } from '@utils';

export class ExternalQuotesService {
  private readonly baseUrl: string;
  private readonly timeout: number = API_CONSTANTS.EXTERNAL_API_TIMEOUT;
  private readonly axiosInstance: AxiosInstance;
  private readonly circuitBreaker: CircuitBreaker;

  constructor() {
    this.baseUrl = config.quotesApiUrl;
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        Accept: 'application/json',
      },
      ...(config.nodeEnv === 'development' && {
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      }),
    });

    axiosRetry(this.axiosInstance, {
      retries: 3,
      retryDelay: exponentialDelay,
      retryCondition: (error) => {
        return (
          isNetworkOrIdempotentRequestError(error) ||
          (error.response?.status ? error.response.status >= 500 : false)
        );
      },
      onRetry: (retryCount, error) => {
        logger.warn('External API: Retrying request', {
          retryCount,
          error: error.message,
        });
      },
    });

    this.circuitBreaker = new CircuitBreaker<[string, Record<string, unknown>?], unknown>(
      this.makeRequest.bind(this),
      {
        timeout: this.timeout + 1000,
        errorThresholdPercentage: config.nodeEnv === 'test' ? 100 : 50,
        resetTimeout: config.nodeEnv === 'test' ? 100 : 30000,
        rollingCountTimeout: 10000,
        rollingCountBuckets: 10,
        name: 'ExternalQuotesAPI',
        enabled: config.nodeEnv !== 'test',
      }
    );

    this.circuitBreaker.on('open', () => {
      logger.error('External API: Circuit breaker opened - too many failures');
    });

    this.circuitBreaker.on('halfOpen', () => {
      logger.warn('External API: Circuit breaker half-open - testing connection');
    });

    this.circuitBreaker.on('close', () => {
      logger.info('External API: Circuit breaker closed - connection restored');
    });
  }

  private async makeRequest<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.axiosInstance.get<T>(url, { params });
    return response.data;
  }

  public async fetchRandomQuote(): Promise<ExternalQuote> {
    try {
      logger.debug('External API: Fetching random quote');
      const data = await this.circuitBreaker.fire('/random');
      logger.info('External API: Successfully fetched random quote');
      const quotes = data as ExternalQuote[];
      return Array.isArray(quotes) ? quotes[0] : (data as ExternalQuote);
    } catch (error) {
      return this.handleAxiosError(error, 'fetchRandomQuote');
    }
  }

  public async fetchQuotesByTag(tag: string, limit = 10): Promise<ExternalQuote[]> {
    try {
      logger.debug('External API: Fetching quotes by tag', { tag, limit });
      const data = await this.circuitBreaker.fire('/quotes', { tags: tag, limit });
      const results = (data as { results: ExternalQuote[] }).results;
      logger.info('External API: Successfully fetched quotes by tag', {
        tag,
        count: results.length,
      });
      return results;
    } catch (error) {
      return this.handleAxiosError(error, 'fetchQuotesByTag');
    }
  }

  public async fetchQuotesByAuthor(author: string, limit = 10): Promise<ExternalQuote[]> {
    try {
      logger.debug('External API: Fetching quotes by author', { author, limit });
      const data = await this.circuitBreaker.fire('/quotes', { author, limit });
      const results = (data as { results: ExternalQuote[] }).results;
      logger.info('External API: Successfully fetched quotes by author', {
        author,
        count: results.length,
      });
      return results;
    } catch (error) {
      return this.handleAxiosError(error, 'fetchQuotesByAuthor');
    }
  }

  public async searchQuotes(query: string, limit = 10): Promise<ExternalQuote[]> {
    try {
      logger.debug('External API: Searching quotes', { query, limit });
      const data = await this.circuitBreaker.fire('/search/quotes', { query, limit });
      const results = (data as { results: ExternalQuote[] }).results;
      logger.info('External API: Successfully searched quotes', {
        query,
        count: results.length,
      });
      return results;
    } catch (error) {
      return this.handleAxiosError(error, 'searchQuotes');
    }
  }

  private handleAxiosError(error: unknown, method: string): never {
    if (isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        logger.error(`External API: Request timeout in ${method}`);
        throw new Error('Request timeout: External API took too long to respond');
      }

      if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'EAI_AGAIN') {
        logger.warn(`External API: DNS resolution failed in ${method}`);
        throw new Error('Network error: Unable to connect to external API');
      }

      if (axiosError.response) {
        logger.error(`External API: HTTP error in ${method}`, {
          status: axiosError.response.status,
          statusText: axiosError.response.statusText,
        });
        throw new Error(`HTTP ${axiosError.response.status}: ${axiosError.response.statusText}`);
      }

      logger.error(`External API: Network error in ${method}`, error);
      throw new Error(`Network error: ${axiosError.message}`);
    }

    logger.error(`External API: Unknown error in ${method}`, error);
    throw new Error('External API error: Unknown error occurred');
  }
}
