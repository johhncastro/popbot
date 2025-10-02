import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { TwitchService } from '../services/twitchService.js';

export const twitchAddCommand = {
  data: new SlashCommandBuilder()
    .setName('twitch-add')
    .setDescription('Add a Twitch streamer to live notifications')
    .addStringOption(option =>
      option
        .setName('username')
        .setDescription('Twitch username to monitor (without @)')
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Discord channel to send notifications to')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName('private')
        .setDescription('Make the response private (ephemeral)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction, twitchService?: TwitchService) {
    const username = interaction.options.getString('username', true).toLowerCase().trim();
    const channel = interaction.options.getChannel('channel', true);
    const isPrivate = interaction.options.getBoolean('private') || false;

    // Check if user has admin permissions
    if (!interaction.memberPermissions?.has('Administrator')) {
      await interaction.reply({
        content: '❌ You need Administrator permissions to manage Twitch notifications.',
        ephemeral: true,
      });
      return;
    }

    // Validate channel
    if (channel.type !== 0) { // 0 = GUILD_TEXT
      await interaction.reply({
        content: '❌ Please select a text channel for notifications.',
        ephemeral: true,
      });
      return;
    }

    if (!twitchService) {
      await interaction.reply({
        content: '❌ Twitch service is not available.',
        ephemeral: true,
      });
      return;
    }

    try {
      await interaction.deferReply({ ephemeral: isPrivate });

      // Check if streamer already exists
      const existingStreamers = twitchService.getStreamers();
      const existingStreamer = existingStreamers.find(s => s.username === username);

      if (existingStreamer) {
        const embed = new EmbedBuilder()
          .setTitle('⚠️ Streamer Already Added')
          .setDescription(`**${username}** is already being monitored!`)
          .setColor(0xffa500)
          .addFields(
            { name: '📺 Username', value: username, inline: true },
            { name: '📊 Status', value: existingStreamer.isLive ? '🔴 Live' : '⚫ Offline', inline: true },
            { name: '📺 Channel', value: `<#${existingStreamer.channelId}>`, inline: true }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Add the streamer
      twitchService.addStreamer(username, channel.id);

      const embed = new EmbedBuilder()
        .setTitle('✅ Streamer Added')
        .setDescription(`**${username}** has been added to live notifications!`)
        .setColor(0x00ff00)
        .addFields(
          { name: '📺 Username', value: username, inline: true },
          { name: '📺 Channel', value: `<#${channel.id}>`, inline: true },
          { name: '🔔 Notifications', value: '@everyone will be pinged when they go live', inline: false }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in twitch-add command:', error);
      await interaction.editReply({
        content: '❌ Failed to add streamer. Please try again later.',
      });
    }
  },
};

export const twitchRemoveCommand = {
  data: new SlashCommandBuilder()
    .setName('twitch-remove')
    .setDescription('Remove a Twitch streamer from live notifications')
    .addStringOption(option =>
      option
        .setName('username')
        .setDescription('Twitch username to remove (without @)')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName('private')
        .setDescription('Make the response private (ephemeral)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction, twitchService?: TwitchService) {
    const username = interaction.options.getString('username', true).toLowerCase().trim();
    const isPrivate = interaction.options.getBoolean('private') || false;

    // Check if user has admin permissions
    if (!interaction.memberPermissions?.has('Administrator')) {
      await interaction.reply({
        content: '❌ You need Administrator permissions to manage Twitch notifications.',
        ephemeral: true,
      });
      return;
    }

    if (!twitchService) {
      await interaction.reply({
        content: '❌ Twitch service is not available.',
        ephemeral: true,
      });
      return;
    }

    try {
      await interaction.deferReply({ ephemeral: isPrivate });

      // Check if streamer exists
      const existingStreamers = twitchService.getStreamers();
      const existingStreamer = existingStreamers.find(s => s.username === username);

      if (!existingStreamer) {
        const embed = new EmbedBuilder()
          .setTitle('❌ Streamer Not Found')
          .setDescription(`**${username}** is not being monitored.`)
          .setColor(0xff0000)
          .addFields(
            { name: '💡 Tip', value: 'Use `/twitch-list` to see all monitored streamers', inline: false }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Remove the streamer
      twitchService.removeStreamer(username);

      const embed = new EmbedBuilder()
        .setTitle('✅ Streamer Removed')
        .setDescription(`**${username}** has been removed from live notifications.`)
        .setColor(0x00ff00)
        .addFields(
          { name: '📺 Username', value: username, inline: true },
          { name: '📊 Previous Status', value: existingStreamer.isLive ? '🔴 Was Live' : '⚫ Was Offline', inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in twitch-remove command:', error);
      await interaction.editReply({
        content: '❌ Failed to remove streamer. Please try again later.',
      });
    }
  },
};

export const twitchListCommand = {
  data: new SlashCommandBuilder()
    .setName('twitch-list')
    .setDescription('List all monitored Twitch streamers')
    .addBooleanOption(option =>
      option
        .setName('private')
        .setDescription('Make the response private (ephemeral)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction, twitchService?: TwitchService) {
    const isPrivate = interaction.options.getBoolean('private') || false;

    // Check if user has admin permissions
    if (!interaction.memberPermissions?.has('Administrator')) {
      await interaction.reply({
        content: '❌ You need Administrator permissions to manage Twitch notifications.',
        ephemeral: true,
      });
      return;
    }

    if (!twitchService) {
      await interaction.reply({
        content: '❌ Twitch service is not available.',
        ephemeral: true,
      });
      return;
    }

    try {
      await interaction.deferReply({ ephemeral: isPrivate });

      const streamers = twitchService.getStreamers();
      const status = twitchService.getStatus();

      const embed = new EmbedBuilder()
        .setTitle('📺 Monitored Twitch Streamers')
        .setColor(0x9146ff)
        .setTimestamp();

      if (streamers.length === 0) {
        embed.setDescription('No streamers are being monitored.\nUse `/twitch-add` to add streamers!');
      } else {
        embed.setDescription(`**${streamers.length}** streamer(s) being monitored:`);
        embed.addFields({
          name: '📊 Status',
          value: status,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in twitch-list command:', error);
      await interaction.editReply({
        content: '❌ Failed to get streamer list. Please try again later.',
      });
    }
  },
};
