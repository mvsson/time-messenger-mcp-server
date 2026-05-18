import type {
  User,
  Team,
  Channel,
  Post,
  PostList,
  Thread,
  ThreadStats,
  ChannelUnread,
  TeamUnread,
  SearchResult,
  ErrorInfo,
} from '../types/time-api.js';
import { TimeApiError } from '../types/time-api.js';

export class TimeClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.token = token;
  }

  get baseUrlValue(): string {
    return this.baseUrl;
  }

  get tokenValue(): string {
    return this.token;
  }

  static async login(baseUrl: string, loginId: string, password: string, mfaToken?: string): Promise<TimeClient> {
    const url = `${baseUrl.replace(/\/$/, '')}/api/v4/users/login`;
    const body: Record<string, string> = { login_id: loginId, password };
    if (mfaToken) {
      body.token = mfaToken;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.ok) {
      const token = response.headers.get('Token') || '';
      if (!token) {
        throw new Error('Login succeeded but no token received');
      }
      return new TimeClient(baseUrl, token);
    }

    const errorBody = await response.json().catch(() => ({})) as Record<string, string>;
    const reason = errorBody.id || '';

    if (reason === 'mfa.totp_required' || reason === 'mfa.challenge') {
      const err = new Error('MFA_REQUIRED') as Error & { mfaRequired: true };
      err.mfaRequired = true;
      throw err;
    }

    throw new Error(`Login failed: ${response.status} - ${errorBody.message || response.statusText}`);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v4${path}`;

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = new TimeApiError(
        `Time API Error: ${response.status} ${response.statusText}`,
        response.status
      );
      try {
        const errorBody = (await response.json()) as ErrorInfo;
        error.errorInfo = errorBody;
        error.message = errorBody.message || error.message;
      } catch {
        // ignore
      }
      throw error;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json() as Promise<T>;
  }

  // ========== Users ==========

  async getMe(): Promise<User> {
    return this.request<User>('GET', '/users/me');
  }

  async getUser(userId: string): Promise<User> {
    return this.request<User>('GET', `/users/${userId}`);
  }

  async searchUsers(term: string): Promise<User[]> {
    return this.request<User[]>('POST', '/users/search', { term });
  }

  // ========== Teams ==========

  async getTeamsForUser(userId: string): Promise<Team[]> {
    return this.request<Team[]>('GET', `/users/${userId}/teams`);
  }

  async getTeam(teamId: string): Promise<Team> {
    return this.request<Team>('GET', `/teams/${teamId}`);
  }

  async getTeamsUnread(userId: string): Promise<TeamUnread[]> {
    return this.request<TeamUnread[]>('GET', `/users/${userId}/teams/unread`);
  }

  async getTeamUnread(userId: string, teamId: string): Promise<TeamUnread> {
    return this.request<TeamUnread>(
      'GET',
      `/users/${userId}/teams/${teamId}/unread`
    );
  }

  // ========== Channels ==========

  async getChannelsForUser(userId: string, teamId: string): Promise<Channel[]> {
    return this.request<Channel[]>(
      'GET',
      `/users/${userId}/teams/${teamId}/channels`
    );
  }

  async getChannel(channelId: string): Promise<Channel> {
    return this.request<Channel>('GET', `/channels/${channelId}`);
  }

  async searchChannels(teamId: string, term: string): Promise<Channel[]> {
    return this.request<Channel[]>(
      'POST',
      `/teams/${teamId}/channels/search`,
      { term }
    );
  }

  async getChannelUnread(
    userId: string,
    channelId: string
  ): Promise<ChannelUnread> {
    return this.request<ChannelUnread>(
      'GET',
      `/users/${userId}/channels/${channelId}/unread`
    );
  }

  // ========== Posts ==========

  async createPost(
    channelId: string,
    message: string,
    rootId?: string
  ): Promise<Post> {
    return this.request<Post>('POST', '/posts', {
      channel_id: channelId,
      message,
      root_id: rootId || '',
    });
  }

  async getPostsForChannel(
    channelId: string,
    page: number = 0,
    perPage: number = 60
  ): Promise<PostList> {
    return this.request<PostList>(
      'GET',
      `/channels/${channelId}/posts?page=${page}&per_page=${perPage}`
    );
  }

  async getPost(postId: string): Promise<Post> {
    return this.request<Post>('GET', `/posts/${postId}`);
  }

  async getPostThread(postId: string): Promise<PostList> {
    return this.request<PostList>('GET', `/posts/${postId}/thread`);
  }

  async searchPosts(teamId: string, terms: string): Promise<SearchResult> {
    return this.request<SearchResult>(
      'POST',
      `/teams/${teamId}/posts/search`,
      { terms }
    );
  }

  // ========== Threads ==========

  async getUserThreads(userId: string, teamId: string): Promise<Thread[]> {
    return this.request<Thread[]>(
      'GET',
      `/users/${userId}/teams/${teamId}/threads`
    );
  }

  async getThreadsStats(
    userId: string,
    teamId: string
  ): Promise<ThreadStats> {
    return this.request<ThreadStats>(
      'GET',
      `/users/${userId}/teams/${teamId}/threads/stats`
    );
  }

  async getUserThread(
    userId: string,
    teamId: string,
    threadId: string
  ): Promise<Thread> {
    return this.request<Thread>(
      'GET',
      `/users/${userId}/teams/${teamId}/threads/${threadId}`
    );
  }

  async startFollowingThread(userId: string, threadId: string): Promise<void> {
    return this.request<void>(
      'POST',
      `/users/${userId}/threads/${threadId}/following`
    );
  }

  async stopFollowingThread(userId: string, threadId: string): Promise<void> {
    return this.request<void>(
      'DELETE',
      `/users/${userId}/threads/${threadId}/following`
    );
  }

  async updateThreadRead(
    userId: string,
    teamId: string,
    threadId: string,
    timestamp: number
  ): Promise<void> {
    return this.request<void>(
      'PUT',
      `/users/${userId}/teams/${teamId}/threads/${threadId}/read/${timestamp}`
    );
  }
}
