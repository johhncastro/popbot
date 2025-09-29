import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface StreamerConfig {
  username: string;
  userId: string;
  channelId: string;
  isLive: boolean;
  lastChecked: number;
  lastLiveTime?: number;
}

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface TwitchStreamResponse {
  data: Array<{
    id: string;
    user_id: string;
    user_login: string;
    user_name: string;
    game_id: string;
    game_name: string;
    type: string;
    title: string;
    viewer_count: number;
    started_at: string;
    language: string;
    thumbnail_url: string;
    tag_ids: string[];
    is_mature: boolean;
  }>;
}

class TwitchService {
  private client: Client;
  private streamers: Map<string, StreamerConfig> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly dataFile = join(process.cwd(), 'streamers.json');
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(client: Client) {
    this.client = client;
    this.loadStreamers();
    this.initializeToken();
    
    // Save streamers every 5 minutes to ensure persistence
    setInterval(() => {
      this.saveStreamers();
    }, 5 * 60 * 1000);
  }

  private async initializeToken(): Promise<void> {
    try {
      await this.getAccessToken();
      console.log('🔑 Twitch API token initialized');
    } catch (error) {
      console.error('Error initializing Twitch token:', error);
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Twitch API credentials not configured');
    }

    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get Twitch token: ${response.statusText}`);
    }

    const data: TwitchTokenResponse = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer

    return this.accessToken;
  }

  addStreamer(username: string, channelId: string): void {
    const streamerId = username.toLowerCase();
    const config: StreamerConfig = {
      username: username.toLowerCase(),
      userId: '', // Will be resolved when first checked
      channelId,
      isLive: false,
      lastChecked: 0,
    };

    this.streamers.set(streamerId, config);
    this.startMonitoring(streamerId);
    this.saveStreamers();
  }

  removeStreamer(username: string): void {
    const streamerId = username.toLowerCase();
    this.streamers.delete(streamerId);
    this.stopMonitoring(streamerId);
    this.saveStreamers();
  }

  private startMonitoring(streamerId: string): void {
    const config = this.streamers.get(streamerId);
    if (!config) return;

    // Clear existing interval if any
    this.stopMonitoring(streamerId);

    // Check every 2 minutes
    const interval = setInterval(async () => {
      await this.checkStreamer(streamerId, config);
    }, 2 * 60 * 1000);

    this.intervals.set(streamerId, interval);

    // Check immediately
    this.checkStreamer(streamerId, config);
  }

  private stopMonitoring(streamerId: string): void {
    const interval = this.intervals.get(streamerId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(streamerId);
    }
  }

  private async checkStreamer(streamerId: string, config: StreamerConfig): Promise<void> {
    try {
      const token = await this.getAccessToken();
      
      // First, get user ID if we don't have it
      if (!config.userId) {
        const userResponse = await fetch(
          `https://api.twitch.tv/helix/users?login=${config.username}`,
          {
            headers: {
              'Client-ID': process.env.TWITCH_CLIENT_ID!,
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (userResponse.ok) {
          const userData = await userResponse.json();
          if (userData.data && userData.data.length > 0) {
            config.userId = userData.data[0].id;
          } else {
            console.error(`Streamer ${config.username} not found`);
            return;
          }
        }
      }

      // Check if streamer is live
      const streamResponse = await fetch(
        `https://api.twitch.tv/helix/streams?user_id=${config.userId}`,
        {
          headers: {
            'Client-ID': process.env.TWITCH_CLIENT_ID!,
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!streamResponse.ok) {
        console.error(`Failed to check stream for ${config.username}: ${streamResponse.statusText}`);
        return;
      }

      const streamData: TwitchStreamResponse = await streamResponse.json();
      const isLive = streamData.data && streamData.data.length > 0;
      const previousStatus = config.isLive;

      config.isLive = isLive;
      config.lastChecked = Date.now();

      // If streamer just went live, send notification
      if (isLive && !previousStatus) {
        const stream = streamData.data[0];
        config.lastLiveTime = Date.now();
        await this.sendLiveNotification(config, stream);
        this.saveStreamers();
      }
      // If streamer went offline, update status
      else if (!isLive && previousStatus) {
        this.saveStreamers();
      }

    } catch (error) {
      console.error(`Error checking streamer ${config.username}:`, error);
    }
  }

  private async sendLiveNotification(config: StreamerConfig, stream: any): Promise<void> {
    try {
      const channel = await this.client.channels.fetch(config.channelId) as TextChannel;
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setTitle('🔴 LIVE NOW!')
        .setDescription(`@everyone **${config.username}** is now live on Twitch!`)
        .setColor(0x9146ff)
        .addFields(
          { name: '📺 Stream Title', value: stream.title || 'No title', inline: false },
          { name: '🎮 Game', value: stream.game_name || 'No game', inline: true },
          { name: '👀 Viewers', value: stream.viewer_count.toString(), inline: true },
          { name: '🌍 Language', value: stream.language || 'Unknown', inline: true }
        )
        .setThumbnail(stream.thumbnail_url?.replace('{width}', '320').replace('{height}', '180') || '')
        .setURL(`https://www.twitch.tv/${config.username}`)
        .setTimestamp()
        .setFooter({ text: 'PopBot Twitch Notifications' });

      await channel.send({ 
        content: `@everyone **${config.username}** is live!`,
        embeds: [embed] 
      });

    } catch (error) {
      console.error('Error sending live notification:', error);
    }
  }

  getStatus(): string {
    const activeStreamers = Array.from(this.streamers.entries()).map(([id, config]) => {
      const status = config.isLive ? '🔴 Live' : '⚫ Offline';
      const lastCheck = config.lastCheck ? `<t:${Math.floor(config.lastCheck / 1000)}:R>` : 'Never';
      return `**${config.username}** - ${status} (Last check: ${lastCheck})`;
    });

    return activeStreamers.length > 0 
      ? activeStreamers.join('\n')
      : 'No streamers being monitored';
  }

  getStreamers(): StreamerConfig[] {
    return Array.from(this.streamers.values());
  }

  private loadStreamers(): void {
    try {
      if (existsSync(this.dataFile)) {
        const data = readFileSync(this.dataFile, 'utf8');
        const savedStreamers = JSON.parse(data);
        
        // Restore streamers from saved data
        for (const [id, config] of Object.entries(savedStreamers)) {
          this.streamers.set(id, config as StreamerConfig);
          this.startMonitoring(id);
        }
        
        console.log(`🔄 Loaded ${this.streamers.size} streamers from persistent storage`);
      }
    } catch (error) {
      console.error('Error loading streamers from storage:', error);
    }
  }

  private saveStreamers(): void {
    try {
      const streamersData = Object.fromEntries(this.streamers);
      writeFileSync(this.dataFile, JSON.stringify(streamersData, null, 2));
    } catch (error) {
      console.error('Error saving streamers to storage:', error);
    }
  }
}

export { TwitchService };
