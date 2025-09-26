import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { MonitorService } from '../services/monitorService.js';

export const monitorCommand = {
  data: new SlashCommandBuilder()
    .setName('monitor')
    .setDescription('Monitor a website and get pinged if it goes down')
    .addStringOption(option =>
      option
        .setName('url')
        .setDescription('The website URL to monitor (e.g., https://kawaiiscan.com)')
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('The channel to ping when the site goes down')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option
        .setName('interval')
        .setDescription('Check interval in minutes (default: 5)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(60)
    )
    .addBooleanOption(option =>
      option
        .setName('start')
        .setDescription('Start monitoring immediately')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction, monitorService?: MonitorService) {
    const url = interaction.options.getString('url', true);
    const channel = interaction.options.getChannel('channel', true);
    const interval = interaction.options.getInteger('interval') || 5;
    const startImmediately = interaction.options.getBoolean('start') || false;

    // Validate URL
    try {
      new URL(url);
    } catch {
      await interaction.reply({
        content: '❌ Invalid URL format. Please provide a valid URL (e.g., https://kawaiiscan.com)',
        ephemeral: true,
      });
      return;
    }

    // Check if channel is a text channel
    if (channel.type !== 0) { // 0 = GUILD_TEXT
      await interaction.reply({
        content: '❌ Please select a text channel for monitoring alerts.',
        ephemeral: true,
      });
      return;
    }

    try {
      // Test the URL immediately
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const isUp = response.ok;
      const statusCode = response.status;
      const statusText = response.statusText;

      const embed = new EmbedBuilder()
        .setTitle('🌐 Website Monitor')
        .setColor(isUp ? 0x00ff00 : 0xff0000)
        .addFields(
          { name: '🔗 URL', value: url, inline: true },
          { name: '📊 Status', value: isUp ? '✅ Online' : '❌ Offline', inline: true },
          { name: '📈 Response', value: `${statusCode} ${statusText}`, inline: true },
          { name: '📺 Channel', value: `<#${channel.id}>`, inline: true },
          { name: '⏰ Interval', value: `${interval} minutes`, inline: true }
        )
        .setTimestamp();

      if (isUp) {
        embed.setDescription('✅ Website is currently online and accessible!');
      } else {
        embed.setDescription('❌ Website is currently offline or unreachable!');
      }

      await interaction.reply({ embeds: [embed] });

      // Add to monitoring service if provided
      if (monitorService) {
        const monitorId = `${url}-${channel.id}`;
        monitorService.addMonitor(monitorId, {
          url,
          channelId: channel.id,
          interval,
          lastStatus: isUp,
          lastCheck: Date.now()
        });

        const statusEmbed = new EmbedBuilder()
          .setTitle('🌐 Monitoring Started')
          .setDescription(`Now monitoring **${url}** every ${interval} minutes in <#${channel.id}>`)
          .setColor(0x00ff00)
          .setTimestamp();

        await interaction.followUp({ embeds: [statusEmbed], ephemeral: true });
      }

    } catch (error) {
      console.error('Error checking website:', error);
      
      const embed = new EmbedBuilder()
        .setTitle('🌐 Website Monitor')
        .setDescription('❌ Failed to check website status. Please verify the URL and try again.')
        .setColor(0xff0000)
        .addFields(
          { name: '🔗 URL', value: url, inline: true },
          { name: '📺 Channel', value: `<#${channel.id}>`, inline: true },
          { name: '⏰ Interval', value: `${interval} minutes`, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};
