import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { YouTubeService } from '../services/youtubeService.js';

export const youtubeAddCommand = {
  data: new SlashCommandBuilder()
    .setName('youtube-add')
    .setDescription('Add a YouTube channel for video notifications (Admin Only)')
    .addStringOption(option =>
      option
        .setName('channel-id')
        .setDescription('The YouTube channel ID (e.g., UC_x5XG1OV2P6uZZ5FSM9Ttw)')
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('The Discord channel to send notifications to')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('channel-name')
        .setDescription('Display name for the YouTube channel (optional)')
        .setRequired(false)
    )
    .addBooleanOption(option =>
      option
        .setName('private')
        .setDescription('Make the response private (ephemeral)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction, youtubeService?: YouTubeService) {
    const youtubeChannelId = interaction.options.getString('channel-id', true).trim();
    const channel = interaction.options.getChannel('channel', true);
    const channelName = interaction.options.getString('channel-name') || 'Unknown Channel';
    const isPrivate = interaction.options.getBoolean('private') || false;

    // Check if user has admin permissions
    if (!interaction.memberPermissions?.has('Administrator')) {
      await interaction.reply({
        content: '❌ You need Administrator permissions to manage YouTube notifications.',
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

    if (!youtubeService) {
      await interaction.reply({
        content: '❌ YouTube service is not available.',
        ephemeral: true,
      });
      return;
    }

    try {
      await interaction.deferReply({ ephemeral: isPrivate });

      // Validate YouTube channel ID format
      if (!youtubeChannelId.match(/^UC[a-zA-Z0-9_-]{22}$/)) {
        await interaction.editReply({
          content: '❌ Invalid YouTube channel ID format. Please provide a valid channel ID (starts with UC).',
        });
        return;
      }

      // Test if the YouTube channel exists
      const testResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet&id=${youtubeChannelId}&key=${process.env.YOUTUBE_API_KEY}`
      );

      if (!testResponse.ok) {
        await interaction.editReply({
          content: '❌ Failed to verify YouTube channel. Please check the channel ID and try again.',
        });
        return;
      }

      const testData = await testResponse.json();
      if (!testData.items || testData.items.length === 0) {
        await interaction.editReply({
          content: '❌ YouTube channel not found. Please check the channel ID and try again.',
        });
        return;
      }

      const actualChannelName = testData.items[0].snippet.title;
      const finalChannelName = channelName === 'Unknown Channel' ? actualChannelName : channelName;

      // Add to monitoring
      const monitorId = `${youtubeChannelId}-${channel.id}`;
      youtubeService.addChannel(monitorId, {
        channelId: channel.id,
        youtubeChannelId,
        channelName: finalChannelName,
        lastVideoId: null,
        lastChecked: Date.now()
      });

      const embed = new EmbedBuilder()
        .setTitle('📺 YouTube Channel Added')
        .setDescription(`Successfully added **${finalChannelName}** for video notifications!`)
        .setColor(0x00ff00)
        .addFields(
          { name: '📺 YouTube Channel', value: `[${finalChannelName}](https://www.youtube.com/channel/${youtubeChannelId})`, inline: true },
          { name: '📢 Discord Channel', value: `<#${channel.id}>`, inline: true },
          { name: '⏰ Check Interval', value: 'Every 5 minutes', inline: true }
        )
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in youtube-add command:', error);
      await interaction.editReply({
        content: '❌ An error occurred while adding the YouTube channel. Please try again later.',
      });
    }
  },
};

export const youtubeRemoveCommand = {
  data: new SlashCommandBuilder()
    .setName('youtube-remove')
    .setDescription('Remove a YouTube channel from notifications (Admin Only)')
    .addStringOption(option =>
      option
        .setName('channel-id')
        .setDescription('The YouTube channel ID to remove')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName('private')
        .setDescription('Make the response private (ephemeral)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction, youtubeService?: YouTubeService) {
    const youtubeChannelId = interaction.options.getString('channel-id', true).trim();
    const isPrivate = interaction.options.getBoolean('private') || false;

    // Check if user has admin permissions
    if (!interaction.memberPermissions?.has('Administrator')) {
      await interaction.reply({
        content: '❌ You need Administrator permissions to manage YouTube notifications.',
        ephemeral: true,
      });
      return;
    }

    if (!youtubeService) {
      await interaction.reply({
        content: '❌ YouTube service is not available.',
        ephemeral: true,
      });
      return;
    }

    try {
      await interaction.deferReply({ ephemeral: isPrivate });

      // Find and remove the channel
      let removed = false;
      for (const [id, config] of youtubeService['channels'].entries()) {
        if (config.youtubeChannelId === youtubeChannelId) {
          youtubeService.removeChannel(id);
          removed = true;
          break;
        }
      }

      if (removed) {
        const embed = new EmbedBuilder()
          .setTitle('📺 YouTube Channel Removed')
          .setDescription(`Successfully removed YouTube channel **${youtubeChannelId}** from notifications.`)
          .setColor(0x00ff00)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply({
          content: '❌ YouTube channel not found in the monitoring list.',
        });
      }

    } catch (error) {
      console.error('Error in youtube-remove command:', error);
      await interaction.editReply({
        content: '❌ An error occurred while removing the YouTube channel. Please try again later.',
      });
    }
  },
};

export const youtubeListCommand = {
  data: new SlashCommandBuilder()
    .setName('youtube-list')
    .setDescription('List all monitored YouTube channels (Admin Only)')
    .addBooleanOption(option =>
      option
        .setName('private')
        .setDescription('Make the response private (ephemeral)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction, youtubeService?: YouTubeService) {
    const isPrivate = interaction.options.getBoolean('private') || false;

    // Check if user has admin permissions
    if (!interaction.memberPermissions?.has('Administrator')) {
      await interaction.reply({
        content: '❌ You need Administrator permissions to manage YouTube notifications.',
        ephemeral: true,
      });
      return;
    }

    if (!youtubeService) {
      await interaction.reply({
        content: '❌ YouTube service is not available.',
        ephemeral: true,
      });
      return;
    }

    try {
      await interaction.deferReply({ ephemeral: isPrivate });

      const channels = youtubeService.getChannels();

      const embed = new EmbedBuilder()
        .setTitle('📺 Monitored YouTube Channels')
        .setDescription(channels)
        .setColor(0x0099ff)
        .setTimestamp()
        .setFooter({ text: 'PopBot YouTube Notifications' });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in youtube-list command:', error);
      await interaction.editReply({
        content: '❌ An error occurred while listing YouTube channels. Please try again later.',
      });
    }
  },
};
