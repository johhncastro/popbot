import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import * as fs from 'fs/promises';
import * as path from 'path';

interface PlayerUUID {
  id: string;
  name: string;
}

interface WhitelistEntry {
  uuid: string;
  name: string;
}

const WHITELIST_PATH = 'C:\\crafty\\crafty-__win64__-_ea59f0d5\\servers\\2f42a4d6-776c-4be0-8e83-4f111c5228a2\\whitelist.json';

export const whitelistCommand = {
  data: new SlashCommandBuilder()
    .setName('whitelist')
    .setDescription('Add a player to the Minecraft server whitelist')
    .addStringOption(option =>
      option
        .setName('username')
        .setDescription('The Minecraft username to whitelist')
        .setRequired(true)
        .setMinLength(3)
        .setMaxLength(16)
    )
    .addBooleanOption(option =>
      option
        .setName('private')
        .setDescription('Make the response private (ephemeral)')
        .setRequired(false)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const username = interaction.options.getString('username', true).trim();
    const isPrivate = interaction.options.getBoolean('private') || false;

    try {
      await interaction.deferReply({ ephemeral: isPrivate });

      // Get player UUID from Mojang API
      const uuidResponse = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
      
      if (uuidResponse.status === 204) {
        await interaction.editReply({
          content: '❌ Player not found. Please check the username and try again.',
        });
        return;
      }

      if (!uuidResponse.ok) {
        await interaction.editReply({
          content: '❌ Failed to fetch player data from Mojang API. Please try again later.',
        });
        return;
      }

      const playerData: PlayerUUID = await uuidResponse.json();
      
      // Format UUID with dashes
      const formattedUUID = playerData.id.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');

      // Read current whitelist
      let whitelist: WhitelistEntry[] = [];
      
      try {
        const whitelistData = await fs.readFile(WHITELIST_PATH, 'utf-8');
        whitelist = JSON.parse(whitelistData);
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          // File doesn't exist, create new whitelist
          console.log('Whitelist file not found, creating new one');
        } else {
          console.error('Error reading whitelist:', error);
          await interaction.editReply({
            content: '❌ Failed to read whitelist file. Please contact an administrator.',
          });
          return;
        }
      }

      // Check if player is already whitelisted
      const existingEntry = whitelist.find(entry => 
        entry.uuid.toLowerCase() === formattedUUID.toLowerCase() || 
        entry.name.toLowerCase() === playerData.name.toLowerCase()
      );

      if (existingEntry) {
        const embed = new EmbedBuilder()
          .setTitle('⚠️ Player Already Whitelisted')
          .setDescription(`**${playerData.name}** is already on the whitelist.`)
          .setColor(0xffaa00)
          .addFields(
            { name: '👤 Username', value: playerData.name, inline: true },
            { name: '🆔 UUID', value: `\`${formattedUUID}\``, inline: true }
          )
          .setTimestamp()
          .setFooter({ text: 'PopBot Whitelist Manager' });

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Add player to whitelist
      const newEntry: WhitelistEntry = {
        uuid: formattedUUID,
        name: playerData.name
      };

      whitelist.push(newEntry);

      // Save whitelist
      try {
        await fs.writeFile(WHITELIST_PATH, JSON.stringify(whitelist, null, 2), 'utf-8');
      } catch (error) {
        console.error('Error writing whitelist:', error);
        await interaction.editReply({
          content: '❌ Failed to write to whitelist file. Please contact an administrator.',
        });
        return;
      }

      // Success response
      const embed = new EmbedBuilder()
        .setTitle('✅ Player Added to Whitelist')
        .setDescription(`**${playerData.name}** has been successfully added to the Minecraft server whitelist!`)
        .setColor(0x00ff00)
        .addFields(
          { name: '👤 Username', value: playerData.name, inline: true },
          { name: '🆔 UUID', value: `\`${formattedUUID}\``, inline: true },
          { name: '📊 Total Players', value: whitelist.length.toString(), inline: true }
        )
        .setThumbnail(`https://mc-heads.net/avatar/${playerData.name}`)
        .setTimestamp()
        .setFooter({ text: 'PopBot Whitelist Manager' });

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in whitelist command:', error);
      await interaction.editReply({
        content: '❌ An error occurred while adding the player to the whitelist. Please try again later.',
      });
    }
  },
};


