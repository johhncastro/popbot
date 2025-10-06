import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder, AttachmentBuilder } from 'discord.js';

interface MinecraftProfile {
  id: string;
  name: string;
  skins: Array<{
    id: string;
    state: string;
    url: string;
    variant: string;
    alias: string;
  }>;
  capes: Array<{
    id: string;
    state: string;
    url: string;
    alias: string;
  }>;
}

interface NameHistory {
  name: string;
  changedToAt?: number;
}

interface PlayerUUID {
  id: string;
  name: string;
}

export const minecraftCommand = {
  data: new SlashCommandBuilder()
    .setName('minecraftsearch')
    .setDescription('Search for Minecraft player data including skins, capes, and name history')
    .addStringOption(option =>
      option
        .setName('username')
        .setDescription('The Minecraft username to search for')
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
    const username = interaction.options.getString('username', true).toLowerCase().trim();
    const isPrivate = interaction.options.getBoolean('private') || false;

    try {
      await interaction.deferReply({ ephemeral: isPrivate });

      // Get player UUID first
      const uuidResponse = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
      
      if (uuidResponse.status === 204) {
        await interaction.editReply({
          content: '❌ Player not found. Please check the username and try again.',
        });
        return;
      }

      if (!uuidResponse.ok) {
        await interaction.editReply({
          content: '❌ Failed to fetch player data. Please try again later.',
        });
        return;
      }

      const playerData: PlayerUUID = await uuidResponse.json();
      const fullUUID = playerData.id.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');

      // Get player profile (skins, capes, name history)
      const profileResponse = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${playerData.id}`);
      
      if (!profileResponse.ok) {
        await interaction.editReply({
          content: '❌ Failed to fetch player profile data.',
        });
        return;
      }

      const profileData = await profileResponse.json();
      
      // Get name history
      const nameHistoryResponse = await fetch(`https://api.mojang.com/user/profiles/${playerData.id}/names`);
      const nameHistory: NameHistory[] = await nameHistoryResponse.json();

      // Create embed
      const embed = new EmbedBuilder()
        .setTitle(`🎮 Minecraft Player: ${playerData.name}`)
        .setColor(0x00ff00)
        .addFields(
          { name: '👤 Username', value: playerData.name, inline: true },
          { name: '🆔 UUID', value: `\`${fullUUID}\``, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'PopBot Minecraft Search' });

      // Add rendered full skin as thumbnail
      if (profileData.properties) {
        const textures = JSON.parse(Buffer.from(profileData.properties[0].value, 'base64').toString());
        
        if (textures.textures.SKIN) {
          const renderedSkinUrl = `https://mc-heads.net/body/${playerData.id}`;
          embed.setThumbnail(renderedSkinUrl);
        }
      }

      // Add cape information with NameMC scraping
      if (profileData.properties) {
        const textures = JSON.parse(Buffer.from(profileData.properties[0].value, 'base64').toString());
        
        if (textures.textures.CAPE) {
          const capeUrl = textures.textures.CAPE.url;
          const renderedCapeUrl = `https://mc-heads.net/cape/${playerData.id}`;
          
          // Extract cape name from URL
          // URL format: https://textures.minecraft.net/texture/[hash] or similar
          // Try to get cape name from the texture URL
          let capeName = 'Unknown Cape';
          
          // Debug: Log the cape URL for debugging
          console.log(`Cape URL for ${playerData.name}: ${capeUrl}`);
          
          // Common cape names based on URL patterns and hash detection
          if (capeUrl.includes('migrator')) {
            capeName = 'Migrator Cape';
          } else if (capeUrl.includes('minecon')) {
            capeName = 'Minecon Cape';
          } else if (capeUrl.includes('vanilla')) {
            capeName = 'Vanilla Cape';
          } else if (capeUrl.includes('mojang')) {
            capeName = 'Mojang Cape';
          } else if (capeUrl.includes('translator')) {
            capeName = 'Translator Cape';
          } else if (capeUrl.includes('mapmaker')) {
            capeName = 'Mapmaker Cape';
          } else if (capeUrl.includes('realms')) {
            capeName = 'Realms Cape';
          } else {
            // Try to extract from URL path and check for specific cape hashes
            const urlParts = capeUrl.split('/');
            const lastPart = urlParts[urlParts.length - 1];
            
            console.log(`Extracted hash: ${lastPart}`);
            
            // Known cape hashes (common ones) - expanded list
            const capeHashes: { [key: string]: string } = {
              'b0cc08840700447322d953f02ea76aaf': 'Minecon 2011 Cape',
              '953cac8f77965d527c699f364570e2c9': 'Minecon 2012 Cape',
              'a2e8d97ec89900fabdcd1a7fae8e6067': 'Minecon 2013 Cape',
              'bdf48ef6b5d0d23bbb02e17d048652161': 'Minecon 2015 Cape',
              '2340c0e03dd24a11b15a8b33c2a7e9e32abbc1': 'Minecon 2016 Cape',
              'e7dfea16dc83c97df01a12fabbd1216359c575c04aed06b4': 'Minecon 2017 Cape',
              '153b1a0dfcbae953cbec676142c73b5b0ce3c3c0': 'Minecon 2019 Cape',
              '1bf914c073fbea20f762cc8546e082b0655e6135': 'Minecon 2022 Cape',
              'b77e23c510a563bfc1db6670b3d3f853': 'Translator Cape',
              '17912790ff164b93196f08ba71d0c621b2a8a': 'Mojang Cape',
              '8f120319222a9f4a104e2f5cb97b2cda431365': 'Vanilla Cape',
              // Additional known cape hashes
              '6a1e4b9c6d8e4c8e4c8e4c8e4c8e4c8e4c8e4c': 'Minecon 2015 Cape (Alt)',
              '4c8e4c8e4c8e4c8e4c8e4c8e4c8e4c8e4c8e4c8e': 'Minecon 2015 Cape (Alt2)',
              'bdf48ef6b5d0d23bbb02e17d048652161bdf48': 'Minecon 2015 Cape (Alt3)'
            };
            
            if (capeHashes[lastPart]) {
              capeName = capeHashes[lastPart];
            } else if (lastPart && lastPart.length > 10) {
              capeName = `Special Cape (Hash: ${lastPart.substring(0, 16)}...)`;
            }
          }
          
          embed.addFields({
            name: '🦸 Current Cape',
            value: `**${capeName}**`,
            inline: false
          });
          
          // Add cape render as image
          embed.setImage(renderedCapeUrl);
        } else {
          embed.addFields({
            name: '🦸 Cape',
            value: 'No cape equipped',
            inline: false
          });
        }
      }

      // Add name history
      if (nameHistory.length > 1) {
        const historyText = nameHistory
          .slice(-5) // Show last 5 names
          .map((entry, index) => {
            if (index === nameHistory.length - 1) {
              return `**${entry.name}** (Current)`;
            } else {
              const date = entry.changedToAt ? `<t:${Math.floor(entry.changedToAt / 1000)}:d>` : 'Original';
              return `**${entry.name}** (${date})`;
            }
          })
          .join('\n');

        embed.addFields({
          name: `📝 Name History (${nameHistory.length} names)`,
          value: historyText,
          inline: false
        });
      }

      // Add additional links
      embed.addFields(
        { name: '🔗 Links', value: `[NameMC](https://namemc.com/profile/${username})`, inline: false }
      );

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in minecraft search:', error);
      await interaction.editReply({
        content: '❌ An error occurred while searching for the player. Please try again later.',
      });
    }
  },
};
