import { describe, it, expect } from 'vitest';
import { formatUser, formatUsers } from '../tools/users.js';
import type { User } from '../types/time-api.js';

const makeUser = (overrides: Partial<User> & { id: string; username: string }): User => ({
  create_at: 0,
  update_at: 0,
  delete_at: 0,
  first_name: '',
  last_name: '',
  nickname: '',
  email: 'test@test.com',
  auth_data: '',
  auth_service: '',
  roles: '',
  locale: 'en',
  notify_props: {},
  ...overrides,
});

describe('formatUser', () => {
  it('formats a user with all fields', () => {
    const user = makeUser({
      id: 'u1',
      username: 'jdoe',
      first_name: 'John',
      last_name: 'Doe',
      nickname: 'Johnny',
      email: 'john@test.com',
      roles: 'admin',
      locale: 'ru',
    });
    const result = formatUser(user);
    expect(result).toContain('User: jdoe');
    expect(result).toContain('ID: u1');
    expect(result).toContain('Name: John Doe');
    expect(result).toContain('Nickname: Johnny');
    expect(result).toContain('Email: john@test.com');
    expect(result).toContain('Locale: ru');
    expect(result).toContain('Roles: admin');
  });

  it('formats user without name and nickname', () => {
    const user = makeUser({ id: 'u1', username: 'test', first_name: '', last_name: '', nickname: '' });
    const result = formatUser(user);
    expect(result).not.toContain('Name:');
    expect(result).not.toContain('Nickname:');
  });

  it('formats user with only first name', () => {
    const user = makeUser({ id: 'u1', username: 'test', first_name: 'John', last_name: '' });
    const result = formatUser(user);
    expect(result).toContain('Name: John');
  });
});

describe('formatUsers', () => {
  it('returns "No users found." for empty list', () => {
    expect(formatUsers([])).toBe('No users found.');
  });

  it('formats a list of users', () => {
    const users = [
      makeUser({ id: 'u1', username: 'alice', first_name: 'Alice', last_name: 'Smith', email: 'alice@test.com' }),
      makeUser({ id: 'u2', username: 'bob', first_name: '', last_name: '', email: 'bob@test.com' }),
    ];
    const result = formatUsers(users);
    expect(result).toContain('Found 2 user(s)');
    expect(result).toContain('Alice Smith (@alice)');
    expect(result).toContain('@bob');
    expect(result).toContain('ID: u1');
    expect(result).toContain('ID: u2');
  });

  it('shows username without name', () => {
    const user = makeUser({ id: 'u1', username: 'nobody', first_name: '', last_name: '' });
    const result = formatUsers([user]);
    expect(result).toContain('@nobody');
  });
});
