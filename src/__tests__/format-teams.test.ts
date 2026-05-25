import { describe, it, expect } from 'vitest';
import { formatTeam, formatTeams, formatTeamsUnread } from '../tools/teams.js';
import type { Team } from '../types/time-api.js';

const makeTeam = (overrides: Partial<Team> & { id: string; display_name: string }): Team => ({
  create_at: 0,
  update_at: 0,
  delete_at: 0,
  name: 'test-team',
  description: '',
  email: '',
  type: 'O',
  invite_id: '',
  scheme_id: '',
  allow_open_invite: false,
  ...overrides,
});

describe('formatTeam', () => {
  it('formats an open team', () => {
    const team = makeTeam({ id: 't1', display_name: 'Engineering', type: 'O' });
    const result = formatTeam(team);
    expect(result).toContain('Team: Engineering');
    expect(result).toContain('Type: Open');
    expect(result).toContain('ID: t1');
  });

  it('formats a private team', () => {
    const team = makeTeam({ id: 't2', display_name: 'Private', type: 'P' });
    expect(formatTeam(team)).toContain('Type: Private');
  });

  it('includes description when present', () => {
    const team = makeTeam({ id: 't1', display_name: 'Test', description: 'A team' });
    expect(formatTeam(team)).toContain('Description: A team');
  });

  it('omits description when empty', () => {
    const team = makeTeam({ id: 't1', display_name: 'Test', description: '' });
    expect(formatTeam(team)).not.toContain('Description:');
  });

  it('shows allow_open_invite', () => {
    const team = makeTeam({ id: 't1', display_name: 'Test', allow_open_invite: true });
    expect(formatTeam(team)).toContain('Allow open invite: true');
  });
});

describe('formatTeams', () => {
  it('returns "No teams found." for empty list', () => {
    expect(formatTeams([])).toBe('No teams found.');
  });

  it('formats a list of teams', () => {
    const teams = [
      makeTeam({ id: 't1', display_name: 'Eng', type: 'O' }),
      makeTeam({ id: 't2', display_name: 'HR', type: 'P' }),
    ];
    const result = formatTeams(teams);
    expect(result).toContain('Found 2 team(s)');
    expect(result).toContain('[Open] Eng');
    expect(result).toContain('[Private] HR');
  });
});

describe('formatTeamsUnread', () => {
  it('returns "No unread messages." for empty list', () => {
    expect(formatTeamsUnread([])).toBe('No unread messages.');
  });

  it('formats unread counts', () => {
    const unread = [
      { team_id: 't1', msg_count: 5, mention_count: 2 },
      { team_id: 't2', msg_count: 0, mention_count: 0 },
    ];
    const result = formatTeamsUnread(unread);
    expect(result).toContain('Team t1');
    expect(result).toContain('Messages: 5');
    expect(result).toContain('Mentions: 2');
    expect(result).toContain('Team t2');
  });
});
