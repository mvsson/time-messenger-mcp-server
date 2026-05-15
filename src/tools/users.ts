import { z } from 'zod';
import type { TimeClient } from '../client/time-client.js';
import type { User } from '../types/time-api.js';

export const userTools = [
  {
    name: 'get_me',
    description: 'Get information about the current user',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (client: TimeClient, args: unknown) => {
      const user = await client.getMe();

      return {
        content: [
          {
            type: 'text',
            text: formatUser(user),
          },
        ],
      };
    },
  },

  {
    name: 'get_user',
    description: 'Get information about a specific user',
    inputSchema: {
      type: 'object',
      properties: {
        user_id: {
          type: 'string',
          description: 'User ID',
        },
      },
      required: ['user_id'],
    },
    handler: async (client: TimeClient, args: unknown) => {
      const schema = z.object({
        user_id: z.string(),
      });

      const params = schema.parse(args);
      const user = await client.getUser(params.user_id);

      return {
        content: [
          {
            type: 'text',
            text: formatUser(user),
          },
        ],
      };
    },
  },

  {
    name: 'search_users',
    description: 'Search users by username, email, or name',
    inputSchema: {
      type: 'object',
      properties: {
        term: {
          type: 'string',
          description: 'Search term',
        },
      },
      required: ['term'],
    },
    handler: async (client: TimeClient, args: unknown) => {
      const schema = z.object({
        term: z.string(),
      });

      const params = schema.parse(args);
      const users = await client.searchUsers(params.term);

      return {
        content: [
          {
            type: 'text',
            text: formatUsers(users),
          },
        ],
      };
    },
  },
];

function formatUser(user: User): string {
  let text = `User: ${user.username}\n`;
  text += `ID: ${user.id}\n`;
  
  if (user.first_name || user.last_name) {
    text += `Name: ${user.first_name} ${user.last_name}\n`;
  }
  
  if (user.nickname) {
    text += `Nickname: ${user.nickname}\n`;
  }
  
  text += `Email: ${user.email}\n`;
  text += `Locale: ${user.locale}\n`;
  
  if (user.roles) {
    text += `Roles: ${user.roles}`;
  }

  return text;
}

function formatUsers(users: User[]): string {
  if (users.length === 0) {
    return 'No users found.';
  }

  const lines = users.map((user) => {
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
    const displayName = name ? `${name} (@${user.username})` : `@${user.username}`;
    return `${displayName}\nID: ${user.id}\nEmail: ${user.email}`;
  });

  return `Found ${users.length} user(s):\n\n${lines.join('\n\n')}`;
}
