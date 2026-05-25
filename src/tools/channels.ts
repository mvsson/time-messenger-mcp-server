import { z } from 'zod';
import type { TimeClient } from '../client/time-client.js';
import type { Channel } from '../types/time-api.js';

export const channelTools = [
  {
    name: 'list_channels',
    description: 'List all channels for the user in a team',
    inputSchema: {
      type: 'object',
      properties: {
        team_id: {
          type: 'string',
          description: 'Team ID',
        },
      },
      required: ['team_id'],
    },
    handler: async (client: TimeClient, args: unknown, userId: string) => {
      const schema = z.object({
        team_id: z.string(),
      });

      const params = schema.parse(args);
      const channels = await client.getChannelsForUser(userId, params.team_id);

      return {
        content: [
          {
            type: 'text',
            text: formatChannels(channels),
          },
        ],
      };
    },
  },

  {
    name: 'get_channel',
    description: 'Get information about a specific channel',
    inputSchema: {
      type: 'object',
      properties: {
        channel_id: {
          type: 'string',
          description: 'Channel ID',
        },
      },
      required: ['channel_id'],
    },
    handler: async (client: TimeClient, args: unknown) => {
      const schema = z.object({
        channel_id: z.string(),
      });

      const params = schema.parse(args);
      const channel = await client.getChannel(params.channel_id);

      return {
        content: [
          {
            type: 'text',
            text: formatChannel(channel),
          },
        ],
      };
    },
  },

  {
    name: 'search_channels',
    description: 'Search channels in a team by name',
    inputSchema: {
      type: 'object',
      properties: {
        team_id: {
          type: 'string',
          description: 'Team ID',
        },
        term: {
          type: 'string',
          description: 'Search term',
        },
      },
      required: ['team_id', 'term'],
    },
    handler: async (client: TimeClient, args: unknown) => {
      const schema = z.object({
        team_id: z.string(),
        term: z.string(),
      });

      const params = schema.parse(args);
      const channels = await client.searchChannels(params.team_id, params.term);

      return {
        content: [
          {
            type: 'text',
            text: formatChannels(channels),
          },
        ],
      };
    },
  },

  {
    name: 'get_channel_unread',
    description: 'Get unread message count and mentions for a channel',
    inputSchema: {
      type: 'object',
      properties: {
        channel_id: {
          type: 'string',
          description: 'Channel ID',
        },
      },
      required: ['channel_id'],
    },
    handler: async (client: TimeClient, args: unknown, userId: string) => {
      const schema = z.object({
        channel_id: z.string(),
      });

      const params = schema.parse(args);
      const unread = await client.getChannelUnread(userId, params.channel_id);

      return {
        content: [
          {
            type: 'text',
            text: `Unread messages: ${unread.msg_count}\nUnread mentions: ${unread.mention_count}`,
          },
        ],
      };
    },
  },
];

export function formatChannels(channels: Channel[]): string {
  if (channels.length === 0) {
    return 'No channels found.';
  }

  const lines = channels.map((channel) => {
    const type = channel.type === 'O' ? 'Public' : channel.type === 'P' ? 'Private' : channel.type === 'D' ? 'Direct' : 'Group';
    const lastPost = channel.last_post_at ? new Date(channel.last_post_at).toLocaleString() : 'Never';
    return `[${type}] ${channel.display_name}\nID: ${channel.id}\nName: ${channel.name}\nLast post: ${lastPost}`;
  });

  return `Found ${channels.length} channel(s):\n\n${lines.join('\n\n')}`;
}

export function formatChannel(channel: Channel): string {
  const type = channel.type === 'O' ? 'Public' : channel.type === 'P' ? 'Private' : channel.type === 'D' ? 'Direct' : 'Group';
  
  let text = `Channel: ${channel.display_name}\n`;
  text += `Type: ${type}\n`;
  text += `ID: ${channel.id}\n`;
  text += `Name: ${channel.name}\n`;
  text += `Team ID: ${channel.team_id}\n`;
  text += `Total messages: ${channel.total_msg_count}\n`;
  
  if (channel.header) {
    text += `\nHeader:\n${channel.header}`;
  }
  
  if (channel.purpose) {
    text += `\nPurpose: ${channel.purpose}`;
  }

  return text;
}
