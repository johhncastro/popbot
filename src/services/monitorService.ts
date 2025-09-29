import { Client, TextChannel, EmbedBuilder } from 'discord.js';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface MonitorConfig {
  url: string;
  channelId: string;
  interval: number; // in minutes
  lastStatus: boolean;
  lastCheck: number;
}

class MonitorService {
  private client: Client;
  private monitors: Map<string, MonitorConfig> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private readonly dataFile = join(process.cwd(), 'monitors.json');

  constructor(client: Client) {
    this.client = client;
    this.loadMonitors();
    
    // Save monitors every 5 minutes to ensure persistence
    setInterval(() => {
      this.saveMonitors();
    }, 5 * 60 * 1000);
  }

  addMonitor(id: string, config: MonitorConfig) {
    this.monitors.set(id, config);
    this.startMonitoring(id);
    this.saveMonitors();
  }

  removeMonitor(id: string) {
    this.monitors.delete(id);
    this.stopMonitoring(id);
    this.saveMonitors();
  }

  private startMonitoring(id: string) {
    const config = this.monitors.get(id);
    if (!config) return;

    // Clear existing interval if any
    this.stopMonitoring(id);

    // Start new monitoring
    const interval = setInterval(async () => {
      await this.checkWebsite(id, config);
    }, config.interval * 60 * 1000);

    this.intervals.set(id, interval);

    // Check immediately
    this.checkWebsite(id, config);
  }

  private stopMonitoring(id: string) {
    const interval = this.intervals.get(id);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(id);
    }
  }

  private async checkWebsite(id: string, config: MonitorConfig) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(config.url, { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const isUp = response.ok;
      const statusCode = response.status;
      const statusText = response.statusText;

      // Update last status
      const previousStatus = config.lastStatus;
      config.lastStatus = isUp;
      config.lastCheck = Date.now();

      // If status changed from up to down, send alert
      if (!isUp && previousStatus !== false) {
        await this.sendDownAlert(config, statusCode, statusText);
        this.saveMonitors(); // Save when status changes
      }
      // If status changed from down to up, send recovery alert
      else if (isUp && previousStatus === false) {
        await this.sendRecoveryAlert(config, statusCode, statusText);
        this.saveMonitors(); // Save when status changes
      }

    } catch (error) {
      console.error(`Error monitoring ${config.url}:`, error);
      
      // If we can't reach the site, consider it down
      if (config.lastStatus !== false) {
        await this.sendDownAlert(config, 0, 'Connection Failed');
      }
    }
  }

  private async sendDownAlert(config: MonitorConfig, statusCode: number, statusText: string) {
    try {
      const channel = await this.client.channels.fetch(config.channelId) as TextChannel;
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setTitle('🚨 Website Down Alert!')
        .setDescription(`@here **${config.url}** is currently offline!`)
        .setColor(0xff0000)
        .addFields(
          { name: '🔗 URL', value: config.url, inline: true },
          { name: '📊 Status', value: `${statusCode} ${statusText}`, inline: true },
          { name: '⏰ Detected', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'PopBot Website Monitor' });

      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error sending down alert:', error);
    }
  }

  private async sendRecoveryAlert(config: MonitorConfig, statusCode: number, statusText: string) {
    try {
      const channel = await this.client.channels.fetch(config.channelId) as TextChannel;
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setTitle('✅ Website Recovery Alert!')
        .setDescription(`**${config.url}** is back online!`)
        .setColor(0x00ff00)
        .addFields(
          { name: '🔗 URL', value: config.url, inline: true },
          { name: '📊 Status', value: `${statusCode} ${statusText}`, inline: true },
          { name: '⏰ Recovered', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'PopBot Website Monitor' });

      await channel.send({ embeds: [embed] });
    } catch (error) {
      console.error('Error sending recovery alert:', error);
    }
  }

  getStatus(): string {
    const activeMonitors = Array.from(this.monitors.entries()).map(([id, config]) => {
      const status = config.lastStatus ? '✅ Online' : '❌ Offline';
      const lastCheck = config.lastCheck ? `<t:${Math.floor(config.lastCheck / 1000)}:R>` : 'Never';
      return `**${config.url}** - ${status} (Last check: ${lastCheck})`;
    });

    return activeMonitors.length > 0 
      ? activeMonitors.join('\n')
      : 'No active monitors';
  }

  private loadMonitors(): void {
    try {
      if (existsSync(this.dataFile)) {
        const data = readFileSync(this.dataFile, 'utf8');
        const savedMonitors = JSON.parse(data);
        
        // Restore monitors from saved data
        for (const [id, config] of Object.entries(savedMonitors)) {
          this.monitors.set(id, config as MonitorConfig);
          this.startMonitoring(id);
        }
        
        console.log(`🔄 Loaded ${this.monitors.size} monitors from persistent storage`);
      }
    } catch (error) {
      console.error('Error loading monitors from storage:', error);
    }
  }

  private saveMonitors(): void {
    try {
      const monitorsData = Object.fromEntries(this.monitors);
      writeFileSync(this.dataFile, JSON.stringify(monitorsData, null, 2));
    } catch (error) {
      console.error('Error saving monitors to storage:', error);
    }
  }
}

export { MonitorService };
