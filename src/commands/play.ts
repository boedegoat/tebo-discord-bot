import { SlashCommandBuilder } from '@discordjs/builders';
// import {
//   joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus,
// } from '@discordjs/voice';
// import path from 'path';
import music from '@koenie06/discord.js-music';
import { GuildMember, VoiceChannel } from 'discord.js';
import Command from '../interfaces/Command';
import createEmbed from '../lib/createEmbed';

// @ts-ignore
const events = music.event;

// @ts-ignore
events.on('playSong', async (channel, songInfo) => {
  /* See all the 'songInfo' options by logging it.. */

  channel.send({
    content: `**🎵 Started playing the song**\n${songInfo.title}\n${songInfo.url}`,
  });
});

const play: Command = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('(beta) Play any music you like 🎵')
    .addStringOption((option) => option
      .setName('song')
      .setDescription('What song name/url you want me to play ?')
      .setRequired(true)),

  run: async (interaction) => {
    const channel = (interaction.member as GuildMember).voice.channel as VoiceChannel;

    if (!channel) {
      throw 'You must inside a voice channel to play a music';
    }

    const song = interaction.options.getString('song', true);

    const embed = createEmbed();
    embed.setDescription('🔍 Searching music...');

    await interaction.editReply({ embeds: [embed] });

    await music.play({
      interaction,
      channel,
      // @ts-ignore
      song,
    });
  },
};

export default play;
