import { describe, it, expect, vi } from 'vitest';
import { authTools } from '../tools/auth.js';
import type { TimeClient } from '../client/time-client.js';
import type { MfaLoginResult } from '../tools/auth.js';

const findTool = (tools: unknown[], name: string) =>
  (tools as { name: string; handler: Function }[]).find((t) => t.name === name)!;

describe('login_with_mfa handler', () => {
  it('returns error when login credentials are not available', async () => {
    const tool = findTool(authTools, 'login_with_mfa');
    const result = await tool.handler(null, { mfa_code: '123456' }, '', {}) as MfaLoginResult;
    expect(result.content[0].text).toContain('Login credentials not available');
    expect(result.client).toBeUndefined();
  });

  it('calls loginFn with correct args on success', async () => {
    const mockClient = { getMe: vi.fn() } as unknown as TimeClient;
    const loginFn = vi.fn().mockResolvedValue(mockClient);
    const tool = findTool(authTools, 'login_with_mfa');
    const result = await tool.handler(null, { mfa_code: '123456' }, '', {
      loginId: 'user',
      password: 'pass',
      timeUrl: 'https://time.test.com',
      loginFn,
    }) as MfaLoginResult;
    expect(loginFn).toHaveBeenCalledWith('https://time.test.com', 'user', 'pass', '123456');
    expect(result.client).toBe(mockClient);
    expect(result.content[0].text).toContain('Login successful');
  });

  it('returns error on login failure', async () => {
    const loginFn = vi.fn().mockRejectedValue(new Error('Invalid MFA code'));
    const tool = findTool(authTools, 'login_with_mfa');
    const result = await tool.handler(null, { mfa_code: 'wrong' }, '', {
      loginId: 'user',
      password: 'pass',
      timeUrl: 'https://time.test.com',
      loginFn,
    }) as MfaLoginResult;
    expect(result.content[0].text).toContain('Login failed');
    expect(result.content[0].text).toContain('Invalid MFA code');
    expect(result.client).toBeUndefined();
  });

  it('rejects empty mfa_code', async () => {
    const tool = findTool(authTools, 'login_with_mfa');
    await expect(tool.handler(null, { mfa_code: '' }, '', {
      loginId: 'u',
      password: 'p',
      timeUrl: 'https://time.test.com',
      loginFn: vi.fn(),
    })).rejects.toThrow();
  });

  it('rejects missing mfa_code', async () => {
    const tool = findTool(authTools, 'login_with_mfa');
    await expect(tool.handler(null, {}, '', {})).rejects.toThrow();
  });
});
