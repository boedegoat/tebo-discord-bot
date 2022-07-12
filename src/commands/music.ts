import { SlashCommandBuilder } from '@discordjs/builders';
import { Player } from 'discord-music-player';
import { GuildMember } from 'discord.js';
import { bot } from '..';
import Command from '../interfaces/Command';
import createEmbed from '../lib/createEmbed';
import errorHandler from '../lib/errorHandler';
import * as handler from '../lib/musicHandler';

type SubcommandHandlers = { [subcommand: string]: () => Promise<void> }

export const player = new Player(bot);

// music event handlers
player
  .on('songAdd', handler.onAddToQueue)
  .on('songChanged', handler.onSongPlayed)
  .on('songFirst', handler.onSongPlayed)
  .on('channelEmpty', handler.onChannelEmpty)
  .on('playlistAdd', handler.onPlaylistAdd)
  .on('queueDestroyed', handler.onQueueEnd)
  .on('queueEnd', handler.onQueueEnd)
  .on('clientDisconnect', handler.onClientDisconnect)
  .on('clientUndeafen', handler.onClientUndeafen)
  .on('error', (error, queue) => {
    console.log(`Error: ${error} in ${queue.guild.name}`);
  });

// TODO: add pause, stop handler
const music: Command = {
  data: new SlashCommandBuilder()
    .setName('music')
    .setDescription('Stay relaxed, and play your favorite music 🎵')
    .addSubcommand((subCommand) => subCommand
      .setName('play')
      .setDescription('Play or add your favorite music into queue')
      .addStringOption((option) => option
        .setName('name')
        .setDescription('Gimme music name'))
      .addStringOption((option) => option
        .setName('url')
        .setDescription('or the music url'))),

  run: async (interaction) => {
    const { options, member } = interaction;

    const guildQueue = player.getQueue(interaction.guild!.id);

    const subcommandHandlers: SubcommandHandlers = {
      play: async () => {
        const { channel } = (member as GuildMember).voice;
        if (!channel) {
          throw 'You must inside a voice channel to play a music';
        }

        const queue = player.createQueue(interaction.guildId!, {
          data: { interaction },
        });

        try {
          const musicName = options.getString('name');
          const musicUrl = options.getString('url');

          if (!musicName && !musicUrl) {
            throw 'Please provide either music name or music url to begin playing music';
          }

          const embed = createEmbed();

          if (musicName) {
            embed.setDescription(`🔍 Searching **${musicName}**`);
          }

          if (musicUrl) {
            embed.setDescription('🔍 Finding music url');
          }

          await interaction.editReply({ embeds: [embed] });

          await queue.join(channel);
          await queue.play((musicName || musicUrl)!, {
            requestedBy: interaction.user,
          });

          await interaction.deleteReply();
        } catch (err) {
          if (!guildQueue) queue.stop();
          errorHandler({ err, interaction });
        }
      },
    };

    const subcommandName = options.getSubcommand(true);
    await subcommandHandlers[subcommandName]();
  },
};

export default music;
