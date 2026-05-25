import { describe, it, expect } from 'vitest';
import { formatChannel, formatChannels } from '../tools/channels.js';
import type { Channel } from '../types/time-api.js';

const makeChannel = (overrides: Partial<Channel> & { id: string; display_name: string }): Channel => ({
  create_at: 0,
  update_at: 0,
  delete_at: 0,
  team_id: 'team1',
  type: 'O',
  name: 'test-channel',
  header: '',
  purpose: '',
  last_post_at: 1000,
  total_msg_count: 42,
  extra_update_at: 0,
  creator_id: 'u1',
  scheme_id: '',
  group_constrained: false,
  shared: false,
  ...overrides,
});

describe('formatChannel', () => {
  it('formats a public channel', () => {
    const channel = makeChannel({ id: 'ch1', display_name: 'General', type: 'O' });
    const result = formatChannel(channel);
    expect(result).toContain('Channel: General');
    expect(result).toContain('Type: Public');
    expect(result).toContain('ID: ch1');
    expect(result).toContain('Total messages: 42');
  });

  it('formats a private channel', () => {
    const channel = makeChannel({ id: 'ch2', display_name: 'Private', type: 'P' });
    expect(formatChannel(channel)).toContain('Type: Private');
  });

  it('formats a direct channel', () => {
    const channel = makeChannel({ id: 'ch3', display_name: 'DM', type: 'D' });
    expect(formatChannel(channel)).toContain('Type: Direct');
  });

  it('formats a group channel', () => {
    const channel = makeChannel({ id: 'ch4', display_name: 'Group', type: 'G' });
    expect(formatChannel(channel)).toContain('Type: Group');
  });

  it('includes header when present', () => {
    const channel = makeChannel({ id: 'ch1', display_name: 'Test', header: 'Channel header' });
    const result = formatChannel(channel);
    expect(result).toContain('Header:');
    expect(result).toContain('Channel header');
  });

  it('includes purpose when present', () => {
    const channel = makeChannel({ id: 'ch1', display_name: 'Test', purpose: 'Channel purpose' });
    const result = formatChannel(channel);
    expect(result).toContain('Purpose: Channel purpose');
  });

  it('omits header and purpose when empty', () => {
    const channel = makeChannel({ id: 'ch1', display_name: 'Test', header: '', purpose: '' });
    const result = formatChannel(channel);
    expect(result).not.toContain('Header:');
    expect(result).not.toContain('Purpose:');
  });
});

describe('formatChannels', () => {
  it('returns "No channels found." for empty list', () => {
    expect(formatChannels([])).toBe('No channels found.');
  });

  it('formats a list of channels', () => {
    const channels = [
      makeChannel({ id: 'ch1', display_name: 'General', type: 'O' }),
      makeChannel({ id: 'ch2', display_name: 'Secret', type: 'P' }),
    ];
    const result = formatChannels(channels);
    expect(result).toContain('Found 2 channel(s)');
    expect(result).toContain('[Public] General');
    expect(result).toContain('[Private] Secret');
  });

  it('shows "Never" when last_post_at is 0', () => {
    const channel = makeChannel({ id: 'ch1', display_name: 'Empty', last_post_at: 0 });
    const result = formatChannels([channel]);
    expect(result).toContain('Last post: Never');
  });
});
