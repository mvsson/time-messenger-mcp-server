import { mkdirSync, readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

interface StoredAuth {
  url: string;
  token: string;
  userId: string;
  savedAt: number;
}

const CONFIG_DIR = join(homedir(), '.time-mcp');
const AUTH_FILE = join(CONFIG_DIR, 'auth.json');

export function loadSavedAuth(timeUrl: string): StoredAuth | null {
  try {
    if (!existsSync(AUTH_FILE)) {
      return null;
    }
    const data = JSON.parse(readFileSync(AUTH_FILE, 'utf-8')) as StoredAuth;
    if (data.url === timeUrl.replace(/\/$/, '') && data.token) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveAuth(timeUrl: string, token: string, userId: string): void {
  try {
    if (!existsSync(CONFIG_DIR)) {
      mkdirSync(CONFIG_DIR, { recursive: true });
    }
    const data: StoredAuth = {
      url: timeUrl.replace(/\/$/, ''),
      token,
      userId,
      savedAt: Date.now(),
    };
    writeFileSync(AUTH_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
  } catch (error) {
    console.error('Failed to save auth:', error);
  }
}

export function clearSavedAuth(): void {
  try {
    if (existsSync(AUTH_FILE)) {
      unlinkSync(AUTH_FILE);
    }
  } catch {
    // ignore
  }
}
