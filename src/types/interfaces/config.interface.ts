import type { LogLevel, NodeEnv } from '../types/config.type';

export interface AppConfig {
  readonly port: number;
  readonly host: string;
  readonly nodeEnv: NodeEnv;
  readonly logLevel: LogLevel;
  readonly quotesApiUrl: string;
  readonly allowedOrigins: string;
  readonly rateLimitMax: number;
  readonly rateLimitWindow: string;
}

export interface RankingWeights {
  readonly recency: number;
  readonly likes: number;
  readonly engagement: number;
}
