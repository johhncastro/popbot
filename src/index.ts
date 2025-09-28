import { Client, GatewayIntentBits, Collection, Events } from 'discord.js';
import { botConfig } from './config.js';
import { rateLimiter } from './rateLimit.js';
import { priceCommand, pricesCommand } from './commands/price.js';
import { rouletteCommand } from './commands/roulette.js';
import { monitorCommand } from './commands/monitor.js';
import { statusCommand } from './commands/status.js';
import { MonitorService } from './services/monitorService.js';

// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// Create a collection to store commands
const commands = new Collection();

// Add commands to the collection
commands.set(priceCommand.data.name, priceCommand);
commands.set(pricesCommand.data.name, pricesCommand);
commands.set(rouletteCommand.data.name, rouletteCommand);
commands.set(monitorCommand.data.name, monitorCommand);
commands.set(statusCommand.data.name, statusCommand);

// Initialize monitoring service
let monitorService: MonitorService;

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ Bot is ready! Logged in as ${readyClient.user.tag}`);
  console.log(`📊 Serving ${commands.size} slash commands`);
  
  // Initialize monitoring service
  monitorService = new MonitorService(client);
  console.log('🌐 Website monitoring service initialized');
});

// Handle slash command interactions
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

    try {
      // Check rate limiting for price commands
      if (interaction.commandName === 'price' || interaction.commandName === 'prices' || interaction.commandName === 'roulette') {
        if (rateLimiter.isRateLimited(interaction.user.id)) {
          const timeUntilReset = rateLimiter.getTimeUntilReset(interaction.user.id);
          const seconds = Math.ceil(timeUntilReset / 1000);
          
          await interaction.reply({
            content: `⏰ Rate limited! Please wait ${seconds} seconds before using price commands again.`,
            ephemeral: true,
          });
          return;
        }
      }

      // Pass monitoring service to monitor and status commands
      if ((interaction.commandName === 'monitor' || interaction.commandName === 'status') && monitorService) {
        await (command as any).execute(interaction, monitorService);
      } else {
        await (command as any).execute(interaction);
      }
  } catch (error) {
    console.error('Error executing command:', error);
    
    const errorMessage = {
      content: '❌ There was an error while executing this command!',
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorMessage);
    } else {
      await interaction.reply(errorMessage);
    }
  }
});

// Handle errors
client.on('error', (error) => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Login to Discord
client.login(botConfig.token).catch((error) => {
  console.error('Failed to login:', error);
  process.exit(1);
});
