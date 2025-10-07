import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface YouTubeConfig {
  channelId: string;
  youtubeChannelId: string;
  channelName: string;
  lastVideoId: string | null;
  lastChecked: number;
}

class YouTubeService {
  private client: Client;
  private channels: Map<string, YouTubeConfig> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly dataFile = join(process.cwd(), 'youtube.json');
  private apiKey: string;

  constructor(client: Client) {
    this.client = client;
    this.apiKey = process.env.YOUTUBE_API_KEY || '';
    
    if (!this.apiKey) {
      console.warn('⚠️ YouTube API key not found. YouTube notifications will not work.');
      return;
    }

    this.loadChannels();
    
    // Save channels every 5 minutes to ensure persistence
    setInterval(() => {
      this.saveChannels();
    }, 5 * 60 * 1000);
  }

  addChannel(id: string, config: YouTubeConfig) {
    this.channels.set(id, config);
    this.startMonitoring(id);
    this.saveChannels();
  }

  removeChannel(id: string) {
    this.channels.delete(id);
    this.stopMonitoring(id);
    this.saveChannels();
  }

  getChannels(): string {
    const activeChannels = Array.from(this.channels.entries()).map(([id, config]) => {
      const lastCheck = config.lastChecked ? `<t:${Math.floor(config.lastChecked / 1000)}:R>` : 'Never';
      return `**${config.channelName}** - <#${config.channelId}> (Last check: ${lastCheck})`;
    });

    return activeChannels.length > 0 
      ? activeChannels.join('\n')
      : 'No YouTube channels being monitored';
  }

  getStatus(): string {
    const activeChannels = Array.from(this.channels.entries()).map(([id, config]) => {
      const lastCheck = config.lastChecked ? `<t:${Math.floor(config.lastChecked / 1000)}:R>` : 'Never';
      return `**${config.channelName}** - <#${config.channelId}> (Last check: ${lastCheck})`;
    });

    return activeChannels.length > 0 
      ? activeChannels.join('\n')
      : 'No YouTube channels being monitored';
  }

  private startMonitoring(id: string) {
    const config = this.channels.get(id);
    if (!config) return;

    // Check immediately
    this.checkForNewVideos(id);

    // Then check every 5 minutes
    const interval = setInterval(() => {
      this.checkForNewVideos(id);
    }, 5 * 60 * 1000);

    this.intervals.set(id, interval);
  }

  private stopMonitoring(id: string) {
    const interval = this.intervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(id);
    }
  }

  private async checkForNewVideos(id: string) {
    const config = this.channels.get(id);
    if (!config) return;

    try {
      // Get channel info and latest video
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${config.youtubeChannelId}&maxResults=1&order=date&type=video&key=${this.apiKey}`
      );

      if (!response.ok) {
        console.error(`Failed to check YouTube channel ${config.channelName}: ${response.statusText}`);
        return;
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const latestVideo = data.items[0];
        const videoId = latestVideo.id.videoId;
        
        // If this is a new video (different from last checked)
        if (videoId !== config.lastVideoId) {
          config.lastVideoId = videoId;
          config.lastChecked = Date.now();
          
          // Send notification
          await this.sendVideoNotification(config, latestVideo);
          this.saveChannels();
        } else {
          // Update last checked time
          config.lastChecked = Date.now();
        }
      }

    } catch (error) {
      console.error(`Error checking YouTube channel ${config.channelName}:`, error);
    }
  }

  private async sendVideoNotification(config: YouTubeConfig, video: any): Promise<void> {
    try {
      const channel = await this.client.channels.fetch(config.channelId) as TextChannel;
      if (!channel) return;

      const videoUrl = `https://www.youtube.com/watch?v=${video.id.videoId}`;
      const channelUrl = `https://www.youtube.com/channel/${config.youtubeChannelId}`;
      
      const embed = new EmbedBuilder()
        .setTitle('📺 New Video Uploaded!')
        .setDescription(`@everyone **${config.channelName}** just uploaded a new video!`)
        .setColor(0xff0000)
        .addFields(
          { name: '📺 Video Title', value: video.snippet.title, inline: false },
          { name: '📅 Published', value: `<t:${Math.floor(new Date(video.snippet.publishedAt).getTime() / 1000)}:R>`, inline: true },
          { name: '👤 Channel', value: `[${config.channelName}](${channelUrl})`, inline: true },
          { name: '🔗 YouTube Link', value: `[youtube.com/watch?v=${video.id.videoId}](${videoUrl})`, inline: false }
        )
        .setThumbnail(video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url)
        .setURL(videoUrl)
        .setTimestamp()
        .setFooter({ text: 'PopBot YouTube Notifications' });

      await channel.send({ 
        content: `@everyone **${config.channelName}** uploaded a new video! 📺`,
        embeds: [embed] 
      });

    } catch (error) {
      console.error('Error sending YouTube notification:', error);
    }
  }

  private loadChannels(): void {
    try {
      if (existsSync(this.dataFile)) {
        const data = readFileSync(this.dataFile, 'utf8');
        const savedChannels = JSON.parse(data);

        for (const [id, config] of Object.entries(savedChannels)) {
          this.channels.set(id, config as YouTubeConfig);
          this.startMonitoring(id);
        }

        console.log(`🔄 Loaded ${this.channels.size} YouTube channels from persistent storage`);
      }
    } catch (error) {
      console.error('Error loading YouTube channels from storage:', error);
    }
  }

  private saveChannels(): void {
    try {
      const channelsData = Object.fromEntries(this.channels);
      writeFileSync(this.dataFile, JSON.stringify(channelsData, null, 2));
    } catch (error) {
      console.error('Error saving YouTube channels to storage:', error);
    }
  }
}

export { YouTubeService };
