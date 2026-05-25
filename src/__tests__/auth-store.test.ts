import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockExistsSync, mockReadFileSync, mockWriteFileSync, mockMkdirSync, mockUnlinkSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn<() => boolean>(),
  mockReadFileSync: vi.fn<() => string>(),
  mockWriteFileSync: vi.fn<() => void>(),
  mockMkdirSync: vi.fn<() => void>(),
  mockUnlinkSync: vi.fn<() => void>(),
}));

vi.mock('node:fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  mkdirSync: mockMkdirSync,
  unlinkSync: mockUnlinkSync,
}));

vi.mock('node:os', () => ({ homedir: () => '/home/testuser' }));

import { loadSavedAuth, saveAuth, clearSavedAuth } from '../client/auth-store.js';

describe('auth-store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadSavedAuth', () => {
    it('returns null when auth file does not exist', () => {
      mockExistsSync.mockReturnValue(false);
      expect(loadSavedAuth('https://time.test.com')).toBeNull();
    });

    it('returns stored auth when URL matches', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({
        url: 'https://time.test.com',
        token: 'saved-token',
        userId: 'u1',
        savedAt: 1700000000000,
      }));
      const result = loadSavedAuth('https://time.test.com');
      expect(result).not.toBeNull();
      expect(result!.token).toBe('saved-token');
      expect(result!.userId).toBe('u1');
    });

    it('strips trailing slash from URL for comparison', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({
        url: 'https://time.test.com',
        token: 't',
        userId: 'u1',
        savedAt: 0,
      }));
      expect(loadSavedAuth('https://time.test.com/')).not.toBeNull();
    });

    it('returns null when URL does not match', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({
        url: 'https://other.test.com',
        token: 't',
        userId: 'u1',
        savedAt: 0,
      }));
      expect(loadSavedAuth('https://time.test.com')).toBeNull();
    });

    it('returns null when file has no token', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(JSON.stringify({
        url: 'https://time.test.com',
        token: '',
        userId: 'u1',
        savedAt: 0,
      }));
      expect(loadSavedAuth('https://time.test.com')).toBeNull();
    });

    it('returns null on invalid JSON', () => {
      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue('not json');
      expect(loadSavedAuth('https://time.test.com')).toBeNull();
    });
  });

  describe('saveAuth', () => {
    it('creates config dir if it does not exist', () => {
      mockExistsSync.mockReturnValue(false);
      saveAuth('https://time.test.com', 'new-token', 'u1');
      expect(mockMkdirSync).toHaveBeenCalledWith(
        '/home/testuser/.time-mcp',
        { recursive: true }
      );
    });

    it('writes auth file with correct data', () => {
      mockExistsSync.mockReturnValue(true);
      saveAuth('https://time.test.com/', 'new-token', 'u1');
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/home/testuser/.time-mcp/auth.json',
        expect.any(String),
        { mode: 0o600 }
      );
      const callArgs = mockWriteFileSync.mock.calls[0] as unknown as [string, string, { mode: number }];
      const written = JSON.parse(callArgs[1]);
      expect(written.url).toBe('https://time.test.com');
      expect(written.token).toBe('new-token');
      expect(written.userId).toBe('u1');
      expect(written.savedAt).toBeTypeOf('number');
    });
  });

  describe('clearSavedAuth', () => {
    it('removes auth file if it exists', () => {
      mockExistsSync.mockReturnValue(true);
      clearSavedAuth();
      expect(mockUnlinkSync).toHaveBeenCalledWith('/home/testuser/.time-mcp/auth.json');
    });

    it('does nothing when auth file does not exist', () => {
      mockExistsSync.mockReturnValue(false);
      clearSavedAuth();
      expect(mockUnlinkSync).not.toHaveBeenCalled();
    });
  });
});
