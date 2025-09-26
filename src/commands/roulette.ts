import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const rouletteCommand = {
  data: new SlashCommandBuilder()
    .setName('roulette')
    .setDescription('Spin the roulette wheel to randomly pick from a list of options')
    .addStringOption(option =>
      option
        .setName('options')
        .setDescription('Comma-separated list of options (max 10, e.g., "Game 1,Game 2,Game 3")')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName('private')
        .setDescription('Make the response private (ephemeral)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const optionsInput = interaction.options.getString('options', true);
    const isPrivate = interaction.options.getBoolean('private') || false;

    // Parse options
    const options = optionsInput
      .split(',')
      .map(option => option.trim())
      .filter(option => option.length > 0);

    if (options.length === 0) {
      await interaction.reply({
        content: '❌ No valid options provided. Please provide at least one option.',
        ephemeral: true,
      });
      return;
    }

    if (options.length > 10) {
      await interaction.reply({
        content: '❌ Too many options! Maximum 10 options allowed.',
        ephemeral: true,
      });
      return;
    }

    if (options.length === 1) {
      await interaction.reply({
        content: '🎯 Only one option provided. The result is: **' + options[0] + '**',
        ephemeral: isPrivate,
      });
      return;
    }

    try {
      // Send initial message
      const initialEmbed = new EmbedBuilder()
        .setTitle('🎰 Roulette Wheel')
        .setDescription('🎡 Spinning the wheel...')
        .setColor(0xff6b6b)
        .addFields(
          { name: '📋 Options', value: options.map((opt, i) => `${i + 1}. ${opt}`).join('\n'), inline: false },
          { name: '⏳ Status', value: 'Spinning...', inline: true }
        )
        .setTimestamp();

      await interaction.reply({
        embeds: [initialEmbed],
        ephemeral: isPrivate,
      });

      // Create spinning animation
      const spinDuration = 3000; // 3 seconds
      const spinSteps = 8;
      const stepDuration = spinDuration / spinSteps;

      for (let i = 0; i < spinSteps; i++) {
        await new Promise(resolve => setTimeout(resolve, stepDuration));

        // Create spinning effect with random selection
        const randomIndex = Math.floor(Math.random() * options.length);
        const selectedOption = options[randomIndex];

        const spinningEmbed = new EmbedBuilder()
          .setTitle('🎰 Roulette Wheel')
          .setDescription('🎡 Spinning the wheel...')
          .setColor(0xff6b6b)
          .addFields(
            { name: '📋 Options', value: options.map((opt, i) => `${i + 1}. ${opt}`).join('\n'), inline: false },
            { name: '⏳ Status', value: 'Spinning...', inline: true },
            { name: '🎯 Current', value: `**${selectedOption}**`, inline: true }
          )
          .setTimestamp();

        await interaction.editReply({ embeds: [spinningEmbed] });
      }

      // Final result
      const finalIndex = Math.floor(Math.random() * options.length);
      const finalResult = options[finalIndex];

      const resultEmbed = new EmbedBuilder()
        .setTitle('🎰 Roulette Wheel - Result!')
        .setDescription(`🎉 **${finalResult}** has been selected!`)
        .setColor(0x4ecdc4)
        .addFields(
          { name: '📋 All Options', value: options.map((opt, i) => `${i + 1}. ${opt}`).join('\n'), inline: false },
          { name: '🎯 Winner', value: `**${finalResult}**`, inline: true },
          { name: '📊 Total Options', value: `${options.length}`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: '🎲 Roulette Wheel by PopBot' });

      await interaction.editReply({ embeds: [resultEmbed] });

    } catch (error) {
      console.error('Error in roulette command:', error);
      await interaction.editReply({
        content: '❌ Failed to spin the roulette wheel. Please try again later.',
      });
    }
  },
};
