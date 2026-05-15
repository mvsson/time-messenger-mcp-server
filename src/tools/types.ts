import type { TimeClient } from '../client/time-client.js';
import type { MfaLoginResult } from './auth.js';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (client: TimeClient | null, args: unknown, userId: string, extra?: any) => Promise<any>;
}
