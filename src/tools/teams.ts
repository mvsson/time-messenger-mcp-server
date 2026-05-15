import { z } from 'zod';
import type { TimeClient } from '../client/time-client.js';
import type { Team } from '../types/time-api.js';

export const teamTools = [
  {
    name: 'list_teams',
    description: 'List all teams for the current user',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (client: TimeClient, args: unknown, userId: string) => {
      const teams = await client.getTeamsForUser(userId);

      return {
        content: [
          {
            type: 'text',
            text: formatTeams(teams),
          },
        ],
      };
    },
  },

  {
    name: 'get_team',
    description: 'Get information about a specific team',
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
    handler: async (client: TimeClient, args: unknown) => {
      const schema = z.object({
        team_id: z.string(),
      });

      const params = schema.parse(args);
      const team = await client.getTeam(params.team_id);

      return {
        content: [
          {
            type: 'text',
            text: formatTeam(team),
          },
        ],
      };
    },
  },

  {
    name: 'get_teams_unread',
    description: 'Get unread message counts for all teams',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: async (client: TimeClient, args: unknown, userId: string) => {
      const unread = await client.getTeamsUnread(userId);

      return {
        content: [
          {
            type: 'text',
            text: formatTeamsUnread(unread),
          },
        ],
      };
    },
  },

  {
    name: 'get_team_unread',
    description: 'Get unread message count for a specific team',
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
      const unread = await client.getTeamUnread(userId, params.team_id);

      return {
        content: [
          {
            type: 'text',
            text: `Team ${params.team_id}:\nUnread messages: ${unread.msg_count}\nUnread mentions: ${unread.mention_count}`,
          },
        ],
      };
    },
  },
];

function formatTeams(teams: Team[]): string {
  if (teams.length === 0) {
    return 'No teams found.';
  }

  const lines = teams.map((team) => {
    const type = team.type === 'O' ? 'Open' : 'Private';
    return `[${type}] ${team.display_name}\nID: ${team.id}\nName: ${team.name}`;
  });

  return `Found ${teams.length} team(s):\n\n${lines.join('\n\n')}`;
}

function formatTeam(team: Team): string {
  const type = team.type === 'O' ? 'Open' : 'Private';
  
  let text = `Team: ${team.display_name}\n`;
  text += `Type: ${type}\n`;
  text += `ID: ${team.id}\n`;
  text += `Name: ${team.name}\n`;
  
  if (team.description) {
    text += `Description: ${team.description}\n`;
  }
  
  text += `Allow open invite: ${team.allow_open_invite}`;

  return text;
}

function formatTeamsUnread(unread: Array<{ team_id: string; msg_count: number; mention_count: number }>): string {
  if (unread.length === 0) {
    return 'No unread messages.';
  }

  const lines = unread.map((u) => {
    return `Team ${u.team_id}:\nMessages: ${u.msg_count}\nMentions: ${u.mention_count}`;
  });

  return lines.join('\n\n');
}
