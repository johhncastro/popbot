import { config } from 'dotenv';

// Load environment variables
config();

export interface BotConfig {
  token: string;
  clientId: string;
  guildId?: string | undefined;
  twitchClientId?: string;
  twitchClientSecret?: string;
  youtubeApiKey?: string;
}

export const botConfig: BotConfig = {
  token: process.env.DISCORD_TOKEN || '',
  clientId: process.env.DISCORD_CLIENT_ID || '',
  guildId: process.env.DISCORD_GUILD_ID || undefined,
  twitchClientId: process.env.TWITCH_CLIENT_ID || undefined,
  twitchClientSecret: process.env.TWITCH_CLIENT_SECRET || undefined,
  youtubeApiKey: process.env.YOUTUBE_API_KEY || undefined,
};

// Validate required configuration
if (!botConfig.token) {
  throw new Error('DISCORD_TOKEN is required');
}

if (!botConfig.clientId) {
  throw new Error('DISCORD_CLIENT_ID is required');
}

export const RATE_LIMIT_WINDOW = 3000; // 3 seconds
export const RATE_LIMIT_MAX_REQUESTS = 1;
export const MAX_SYMBOLS_PER_REQUEST = 10;
