import { SlashCommandBuilder } from '@discordjs/builders';
import { GuildMember } from 'discord.js';
import { player } from '..';
import Command from '../interfaces/Command';
import createEmbed from '../lib/createEmbed';

// TODO: add pause, stop handler
const play: Command = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('(beta) Play any music you like 🎵')
    .addStringOption((option) => option
      .setName('song')
      .setDescription('What song name/url you want me to play ?')
      .setRequired(true)),

  run: async (interaction) => {
    const { channel } = (interaction.member as GuildMember).voice;

    if (!channel) {
      throw 'You must inside a voice channel to play a music';
    }

    const song = interaction.options.getString('song', true);

    const embed = createEmbed();
    embed.setDescription('🔍 Searching music...');

    await interaction.editReply({ embeds: [embed] });

    const queue = player.createQueue(interaction.guildId!);
    await queue.join(channel);
    const songInfo = await queue.play(song);

    await interaction.followUp(`**🎵 Started playing the song**\n${songInfo.name}\n${songInfo.url}`);
  },
};

export default play;
