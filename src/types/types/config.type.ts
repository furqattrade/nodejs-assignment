import { LOG_LEVEL, NODE_ENV } from '@constants';

export type NodeEnv = (typeof NODE_ENV)[keyof typeof NODE_ENV];
export type LogLevel = (typeof LOG_LEVEL)[keyof typeof LOG_LEVEL];
