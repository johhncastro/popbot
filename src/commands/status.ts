import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { MonitorService } from '../services/monitorService.js';

export const statusCommand = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check the status of the monitoring service and all monitored websites')
    .addBooleanOption(option =>
      option
        .setName('private')
        .setDescription('Make the response private (ephemeral)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction, monitorService?: MonitorService) {
    const isPrivate = interaction.options.getBoolean('private') || false;

    try {
      await interaction.deferReply({ ephemeral: isPrivate });

      // Check if monitoring service is available
      if (!monitorService) {
        const embed = new EmbedBuilder()
          .setTitle('🔧 Monitoring Service Status')
          .setDescription('❌ Monitoring service is not available')
          .setColor(0xff0000)
          .addFields(
            { name: 'Status', value: '❌ Service Unavailable', inline: true },
            { name: 'Error', value: 'Monitoring service not initialized', inline: true }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Get monitoring status
      const status = monitorService.getStatus();
      const activeMonitors = status.split('\n').filter(line => line.trim() !== '');

      const embed = new EmbedBuilder()
        .setTitle('🔧 Monitoring Service Status')
        .setDescription('✅ Monitoring service is running and active')
        .setColor(0x00ff00)
        .addFields(
          { name: 'Service Status', value: '✅ Online', inline: true },
          { name: 'Active Monitors', value: activeMonitors.length.toString(), inline: true },
          { name: 'Last Check', value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
        )
        .setTimestamp();

      if (activeMonitors.length > 0) {
        // Show first 10 monitors to avoid embed limits
        const displayMonitors = activeMonitors.slice(0, 10);
        const monitorsText = displayMonitors.join('\n');
        
        embed.addFields({
          name: '📊 Monitored Websites',
          value: monitorsText.length > 1024 ? monitorsText.substring(0, 1021) + '...' : monitorsText,
          inline: false
        });

        if (activeMonitors.length > 10) {
          embed.addFields({
            name: 'Note',
            value: `Showing first 10 of ${activeMonitors.length} monitors`,
            inline: false
          });
        }
      } else {
        embed.addFields({
          name: '📊 Monitored Websites',
          value: 'No active monitors. Use `/monitor` to start monitoring a website.',
          inline: false
        });
      }

      // Add service information
      embed.addFields(
        { name: '🔧 Service Info', value: 'PopBot Monitoring Service', inline: true },
        { name: '⚡ Uptime', value: 'Running', inline: true },
        { name: '🔄 Auto-Recovery', value: 'Enabled', inline: true }
      );

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in status command:', error);
      
      const embed = new EmbedBuilder()
        .setTitle('🔧 Monitoring Service Status')
        .setDescription('❌ Failed to get monitoring status')
        .setColor(0xff0000)
        .addFields(
          { name: 'Error', value: 'Unable to retrieve service status', inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    }
  },
};
