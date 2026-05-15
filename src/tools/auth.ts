import { z } from 'zod';
import type { TimeClient } from '../client/time-client.js';
import type { ToolDefinition } from './types.js';

export interface MfaLoginResult {
  content: Array<{ type: string; text: string }>;
  client?: TimeClient;
}

export const authTools: ToolDefinition[] = [
  {
    name: 'login_with_mfa',
    description: 'Login to Time Messenger with MFA code. Use this when regular login requires MFA verification. Enter the 6-digit code from your authenticator app.',
    inputSchema: {
      type: 'object',
      properties: {
        mfa_code: {
          type: 'string',
          description: '6-digit MFA code from authenticator app',
        },
      },
      required: ['mfa_code'],
    },
    handler: async (
      _client: TimeClient | null,
      args: unknown,
      _userId: string,
      extra: {
        loginId?: string;
        password?: string;
        timeUrl?: string;
        loginFn?: (url: string, loginId: string, password: string, mfaToken: string) => Promise<TimeClient>;
      }
    ): Promise<MfaLoginResult> => {
      const schema = z.object({
        mfa_code: z.string().min(1, 'MFA code is required'),
      });

      const params = schema.parse(args);

      if (!extra.loginId || !extra.password || !extra.timeUrl || !extra.loginFn) {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'Error: Login credentials not available. Please set TIME_LOGIN_ID and TIME_PASSWORD environment variables.',
            },
          ],
        };
      }

      try {
        const newClient = await extra.loginFn(
          extra.timeUrl,
          extra.loginId,
          extra.password,
          params.mfa_code
        );
        return {
          content: [
            {
              type: 'text' as const,
              text: 'Login successful! MFA verified. You can now use all Time tools.',
            },
          ],
          client: newClient,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return {
          content: [
            {
              type: 'text' as const,
              text: `Login failed: ${message}\n\nPlease check your MFA code and try again.`,
            },
          ],
        };
      }
    },
  },
];
