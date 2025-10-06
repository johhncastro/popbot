import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';

export const helpCommand = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get help and information about all bot commands')
    .addStringOption(option =>
      option
        .setName('command')
        .setDescription('Get specific help for a command')
        .setRequired(false)
        .addChoices(
          { name: '💰 Price', value: 'price' },
          { name: '📊 Prices', value: 'prices' },
          { name: '🎰 Roulette', value: 'roulette' },
          { name: '🎮 Minecraft Search', value: 'minecraftsearch' },
          { name: '🌐 Monitor', value: 'monitor' },
          { name: '🔧 Status', value: 'status' },
          { name: '📺 Twitch Add', value: 'twitch-add' },
          { name: '📺 Twitch Remove', value: 'twitch-remove' },
          { name: '📺 Twitch List', value: 'twitch-list' }
        )
    )
    .addBooleanOption(option =>
      option
        .setName('private')
        .setDescription('Make the response private (ephemeral)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const command = interaction.options.getString('command');
    const isPrivate = interaction.options.getBoolean('private') || false;

    try {
      await interaction.deferReply({ ephemeral: isPrivate });

      if (command) {
        // Show specific command help
        const embed = createSpecificCommandHelp(command);
        await interaction.editReply({ embeds: [embed] });
      } else {
        // Show general help
        const embed = createGeneralHelp();
        await interaction.editReply({ embeds: [embed] });
      }

    } catch (error) {
      console.error('Error in help command:', error);
      await interaction.editReply({
        content: '❌ Failed to get help information. Please try again later.',
      });
    }
  },
};

function createGeneralHelp(): EmbedBuilder {
  return new EmbedBuilder()
    .setTitle('🤖 PopBot - Help & Commands')
    .setDescription('A Discord bot for crypto prices, games, and website monitoring!')
    .setColor(0x0099ff)
    .addFields(
      {
        name: '💰 Crypto Commands',
        value: '`/price` - Get single cryptocurrency price\n`/prices` - Get multiple cryptocurrency prices',
        inline: false
      },
      {
        name: '🎰 Fun Commands',
        value: '`/roulette` - Spin the wheel for random selection\n`/minecraftsearch` - Search Minecraft player data',
        inline: false
      },
      {
        name: '🌐 Monitoring Commands (Admin Only)',
        value: '`/monitor` - Monitor websites and get alerts\n`/status` - Check monitoring service status',
        inline: false
      },
      {
        name: '📺 Twitch Commands (Admin Only)',
        value: '`/twitch-add` - Add streamer for live notifications\n`/twitch-remove` - Remove streamer from notifications\n`/twitch-list` - List all monitored streamers',
        inline: false
      },
      {
        name: '📋 Quick Examples',
        value: '`/price symbol:btc`\n`/prices symbols:btc,eth,sol`\n`/roulette options:"Game 1,Game 2"`\n`/monitor url:https://example.com channel:#alerts`\n`/twitch-add username:ninja channel:#live`',
        inline: false
      },
      {
        name: '🔧 Need Specific Help?',
        value: 'Use `/help command:price` to get detailed help for a specific command!',
        inline: false
      }
    )
    .setFooter({ text: 'PopBot - Your Discord companion for crypto and monitoring!' })
    .setTimestamp();
}

function createSpecificCommandHelp(command: string): EmbedBuilder {
  const helpData: Record<string, { title: string; description: string; usage: string; examples: string[] }> = {
    price: {
      title: '💰 /price Command',
      description: 'Get the current price of a single cryptocurrency',
      usage: '/price symbol:<crypto> [vs:<currency>] [private:<true/false>]',
      examples: [
        '/price symbol:btc',
        '/price symbol:eth vs:eur',
        '/price symbol:sol private:true'
      ]
    },
    prices: {
      title: '📊 /prices Command',
      description: 'Get current prices for multiple cryptocurrencies (up to 10)',
      usage: '/prices symbols:<crypto1,crypto2,...> [vs:<currency>] [private:<true/false>]',
      examples: [
        '/prices symbols:btc,eth,sol',
        '/prices symbols:btc,eth,ada,dot vs:eur',
        '/prices symbols:btc,eth,sol,ada,dot,link,atom,near,avax,matic'
      ]
    },
    roulette: {
      title: '🎰 /roulette Command',
      description: 'Spin the roulette wheel to randomly pick from a list of options',
      usage: '/roulette options:"Option1,Option2,..." [private:<true/false>]',
      examples: [
        '/roulette options:"Minecraft,Fortnite,Among Us"',
        '/roulette options:"Alice,Bob,Charlie,David"',
        '/roulette options:"Pizza,Burger,Sushi,Tacos" private:true'
      ]
    },
    'minecraftsearch': {
      title: '🎮 /minecraftsearch Command',
      description: 'Search for Minecraft player data including skins, capes, and name history',
      usage: '/minecraftsearch username:<player> [private:<true/false>]',
      examples: [
        '/minecraftsearch username:notch',
        '/minecraftsearch username:dream',
        '/minecraftsearch username:technoblade private:true'
      ]
    },
    monitor: {
      title: '🌐 /monitor Command (Admin Only)',
      description: 'Monitor a website and get pinged if it goes down (requires Administrator permissions)',
      usage: '/monitor url:<website> channel:<#channel> [interval:<minutes>] [start:<true/false>]',
      examples: [
        '/monitor url:https://kawaiiscan.com channel:#alerts',
        '/monitor url:https://example.com channel:#monitoring interval:10 start:true',
        '/monitor url:https://mysite.com channel:#alerts interval:5'
      ]
    },
    status: {
      title: '🔧 /status Command (Admin Only)',
      description: 'Check the status of the monitoring service and all monitored websites (requires Administrator permissions)',
      usage: '/status [private:<true/false>]',
      examples: [
        '/status',
        '/status private:true'
      ]
    },
    'twitch-add': {
      title: '📺 /twitch-add Command (Admin Only)',
      description: 'Add a Twitch streamer to live notifications (requires Administrator permissions)',
      usage: '/twitch-add username:<streamer> channel:<#channel> [private:<true/false>]',
      examples: [
        '/twitch-add username:ninja channel:#live',
        '/twitch-add username:shroud channel:#notifications',
        '/twitch-add username:pokimane channel:#streams private:true'
      ]
    },
    'twitch-remove': {
      title: '📺 /twitch-remove Command (Admin Only)',
      description: 'Remove a Twitch streamer from live notifications (requires Administrator permissions)',
      usage: '/twitch-remove username:<streamer> [private:<true/false>]',
      examples: [
        '/twitch-remove username:ninja',
        '/twitch-remove username:shroud private:true'
      ]
    },
    'twitch-list': {
      title: '📺 /twitch-list Command (Admin Only)',
      description: 'List all monitored Twitch streamers and their status (requires Administrator permissions)',
      usage: '/twitch-list [private:<true/false>]',
      examples: [
        '/twitch-list',
        '/twitch-list private:true'
      ]
    }
  };

  const data = helpData[command];
  if (!data) {
    return new EmbedBuilder()
      .setTitle('❌ Command Not Found')
      .setDescription('The specified command was not found.')
      .setColor(0xff0000);
  }

  return new EmbedBuilder()
    .setTitle(data.title)
    .setDescription(data.description)
    .setColor(0x00ff00)
    .addFields(
      {
        name: '📝 Usage',
        value: `\`${data.usage}\``,
        inline: false
      },
      {
        name: '💡 Examples',
        value: data.examples.map(ex => `\`${ex}\``).join('\n'),
        inline: false
      },
      {
        name: 'ℹ️ Tips',
        value: getCommandTips(command),
        inline: false
      }
    )
    .setFooter({ text: 'Use /help to see all commands' })
    .setTimestamp();
}

function getCommandTips(command: string): string {
  const tips: Record<string, string> = {
    price: '• Supports 100+ cryptocurrencies\n• Use lowercase symbols (btc, eth, sol)\n• Multiple currencies supported (USD, EUR, GBP, etc.)',
    prices: '• Maximum 10 symbols per request\n• Use commas to separate symbols\n• Rate limited to 1 request per 3 seconds',
    roulette: '• Maximum 10 options per spin\n• Use quotes around the options list\n• Great for random selection games',
    monitor: '• Monitors websites every 5 minutes by default\n• Sends @here alerts when sites go down\n• Automatically detects recovery',
    status: '• Shows all active monitors\n• Displays last check times\n• Helps troubleshoot monitoring issues',
    'twitch-add': '• Use Twitch username without @ symbol\n• @everyone will be pinged when they go live\n• Check every 2 minutes for live status',
    'twitch-remove': '• Use exact username to remove\n• No confirmation needed\n• Immediately stops monitoring',
    'twitch-list': '• Shows all monitored streamers\n• Displays live/offline status\n• Shows last check times'
  };

  return tips[command] || 'No specific tips available for this command.';
}
