import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { coingeckoProvider } from '../providers/coingecko.js';
import { createPriceEmbed, createPricesEmbeds, parseSymbols, validateSymbols, getHelpfulSymbols } from './_shared.js';
import { MAX_SYMBOLS_PER_REQUEST } from '../config.js';

export const priceCommand = {
  data: new SlashCommandBuilder()
    .setName('price')
    .setDescription('Get the current price of a cryptocurrency')
    .addStringOption(option =>
      option
        .setName('symbol')
        .setDescription('The cryptocurrency symbol (e.g., btc, eth, sol)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('vs')
        .setDescription('The currency to compare against (default: usd)')
        .setRequired(false)
        .addChoices(
          { name: 'USD', value: 'usd' },
          { name: 'EUR', value: 'eur' },
          { name: 'GBP', value: 'gbp' },
          { name: 'JPY', value: 'jpy' },
          { name: 'CAD', value: 'cad' },
          { name: 'AUD', value: 'aud' }
        )
    )
    .addBooleanOption(option =>
      option
        .setName('private')
        .setDescription('Make the response private (ephemeral)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const symbol = interaction.options.getString('symbol', true).toLowerCase().trim();
    const vs = interaction.options.getString('vs') || 'usd';
    const isPrivate = interaction.options.getBoolean('private') || false;

    // Validate symbol
    const { valid, invalid } = validateSymbols([symbol]);
    if (invalid.length > 0) {
      const helpfulSymbols = getHelpfulSymbols().slice(0, 10).join(', ');
      await interaction.reply({
        content: `❌ Invalid symbol: \`${symbol}\`\n\n` +
                `Please use a valid cryptocurrency symbol (2-10 characters, letters and numbers only).\n` +
                `Popular symbols: ${helpfulSymbols}`,
        ephemeral: true,
      });
      return;
    }

    try {
      await interaction.deferReply({ ephemeral: isPrivate });

      const priceData = await coingeckoProvider.getPrices([symbol], vs);
      const data = priceData[0];

      if (!data || data.price === 0) {
        const helpfulSymbols = getHelpfulSymbols().slice(0, 10).join(', ');
        await interaction.editReply({
          content: `❌ Symbol \`${symbol.toUpperCase()}\` not found.\n\n` +
                  `Please check the symbol and try again.\n` +
                  `Popular symbols: ${helpfulSymbols}`,
        });
        return;
      }

      const embed = createPriceEmbed(data, vs);
      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in price command:', error);
      await interaction.editReply({
        content: '❌ Failed to fetch price data. Please try again later.',
      });
    }
  },
};

export const pricesCommand = {
  data: new SlashCommandBuilder()
    .setName('prices')
    .setDescription('Get current prices for multiple cryptocurrencies')
    .addStringOption(option =>
      option
        .setName('symbols')
        .setDescription('Comma-separated list of cryptocurrency symbols (max 10, e.g., btc,eth,sol)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName('vs')
        .setDescription('The currency to compare against (default: usd)')
        .setRequired(false)
        .addChoices(
          { name: 'USD', value: 'usd' },
          { name: 'EUR', value: 'eur' },
          { name: 'GBP', value: 'gbp' },
          { name: 'JPY', value: 'jpy' },
          { name: 'CAD', value: 'cad' },
          { name: 'AUD', value: 'aud' }
        )
    )
    .addBooleanOption(option =>
      option
        .setName('private')
        .setDescription('Make the response private (ephemeral)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const symbolsInput = interaction.options.getString('symbols', true);
    const vs = interaction.options.getString('vs') || 'usd';
    const isPrivate = interaction.options.getBoolean('private') || false;

    // Parse and validate symbols
    const symbols = parseSymbols(symbolsInput);
    
    if (symbols.length === 0) {
      await interaction.reply({
        content: '❌ No valid symbols provided. Please provide at least one cryptocurrency symbol.',
        ephemeral: true,
      });
      return;
    }

    if (symbols.length > MAX_SYMBOLS_PER_REQUEST) {
      await interaction.reply({
        content: `❌ Too many symbols! Maximum ${MAX_SYMBOLS_PER_REQUEST} symbols allowed.`,
        ephemeral: true,
      });
      return;
    }

    const { valid, invalid } = validateSymbols(symbols);
    
    if (invalid.length > 0) {
      const helpfulSymbols = getHelpfulSymbols().slice(0, 10).join(', ');
      await interaction.reply({
        content: `❌ Invalid symbols: \`${invalid.join(', ')}\`\n\n` +
                `Please use valid cryptocurrency symbols (2-10 characters, letters and numbers only).\n` +
                `Popular symbols: ${helpfulSymbols}`,
        ephemeral: true,
      });
      return;
    }

    try {
      await interaction.deferReply({ ephemeral: isPrivate });

      const priceData = await coingeckoProvider.getPrices(valid, vs);
      
      if (priceData.length === 0) {
        await interaction.editReply({
          content: '❌ No price data found for the provided symbols.',
        });
        return;
      }

      const embeds = createPricesEmbeds(priceData, vs);
      
      if (embeds.length === 0) {
        await interaction.editReply({
          content: '❌ Failed to format price data.',
        });
        return;
      }

      // Discord allows up to 10 embeds per message
      const maxEmbeds = Math.min(embeds.length, 10);
      await interaction.editReply({ embeds: embeds.slice(0, maxEmbeds) });

    } catch (error) {
      console.error('Error in prices command:', error);
      await interaction.editReply({
        content: '❌ Failed to fetch price data. Please try again later.',
      });
    }
  },
};
