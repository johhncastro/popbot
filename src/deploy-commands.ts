import { REST, Routes } from 'discord.js';
import { botConfig } from './config.js';
import { priceCommand, pricesCommand } from './commands/price.js';
import { rouletteCommand } from './commands/roulette.js';
import { monitorCommand } from './commands/monitor.js';
import { statusCommand } from './commands/status.js';
import { helpCommand } from './commands/help.js';
import { twitchAddCommand, twitchRemoveCommand, twitchListCommand } from './commands/twitch.js';

const commands = [
  priceCommand.data.toJSON(),
  pricesCommand.data.toJSON(),
  rouletteCommand.data.toJSON(),
  monitorCommand.data.toJSON(),
  statusCommand.data.toJSON(),
  helpCommand.data.toJSON(),
  twitchAddCommand.data.toJSON(),
  twitchRemoveCommand.data.toJSON(),
  twitchListCommand.data.toJSON(),
];

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(botConfig.token);

// Parse command line arguments
const args = process.argv.slice(2);
const isGuild = args.includes('--guild');
const isGlobal = args.includes('--global');

if (!isGuild && !isGlobal) {
  console.error('❌ Please specify either --guild or --global');
  console.log('Usage: npm run deploy:guild or npm run deploy:global');
  process.exit(1);
}

(async () => {
  try {
    console.log(`🚀 Started refreshing ${commands.length} application (/) commands.`);

    let data: any;

    if (isGuild) {
      if (!botConfig.guildId) {
        console.error('❌ DISCORD_GUILD_ID is required for guild deployment');
        process.exit(1);
      }
      
      // Deploy commands to a specific guild (faster for development)
      data = await rest.put(
        Routes.applicationGuildCommands(botConfig.clientId, botConfig.guildId),
        { body: commands },
      );
      
      console.log(`✅ Successfully reloaded ${data.length} guild application (/) commands.`);
      console.log(`📋 Commands deployed to guild: ${botConfig.guildId}`);
    } else {
      // Deploy commands globally (can take up to 1 hour to propagate)
      data = await rest.put(
        Routes.applicationCommands(botConfig.clientId),
        { body: commands },
      );
      
      console.log(`✅ Successfully reloaded ${data.length} global application (/) commands.`);
      console.log('⏰ Note: Global commands can take up to 1 hour to propagate across Discord.');
    }

    console.log('\n📋 Deployed commands:');
    commands.forEach((command, index) => {
      console.log(`  ${index + 1}. /${command.name} - ${command.description}`);
    });

  } catch (error) {
    console.error('❌ Error deploying commands:', error);
    process.exit(1);
  }
})();
