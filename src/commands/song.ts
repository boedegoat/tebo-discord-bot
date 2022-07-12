import { SlashCommandBuilder } from '@discordjs/builders';
import { Player } from 'discord-music-player';
import { GuildMember } from 'discord.js';
import { bot } from '..';
import Command from '../interfaces/Command';
import createEmbed from '../lib/createEmbed';
import errorHandler from '../lib/errorHandler';
import * as handler from '../lib/songHandler';

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

const song: Command = {
  data: new SlashCommandBuilder()
    .setName('song')
    .setDescription('Stay relaxed, and play your favorite song 🎵')
    .addSubcommand((subcommand) => subcommand
      .setName('play')
      .setDescription('Play or add your favorite song into queue')
      .addStringOption((option) => option
        .setName('name')
        .setDescription('Gimme song name'))
      .addStringOption((option) => option
        .setName('url')
        .setDescription('or the song url')))
    .addSubcommand((subcommand) => subcommand
      .setName('skip')
      .setDescription('Skip current song and play next song in queue'))
    .addSubcommand((subcommand) => subcommand
      .setName('stop')
      .setDescription('Stop playing song'))
    .addSubcommand((subcommand) => subcommand
      .setName('now-playing')
      .setDescription('Get current song playing')),

  run: async (interaction) => {
    const { options, member } = interaction;

    const guildQueue = player.getQueue(interaction.guild!.id);
    const embed = createEmbed();

    const subcommandHandlers: SubcommandHandlers = {
      play: async () => {
        const { channel } = (member as GuildMember).voice;
        if (!channel) {
          throw 'You must inside a voice channel to play a song';
        }

        const queue = player.createQueue(interaction.guildId!, {
          data: { interaction },
        });

        try {
          const songName = options.getString('name');
          const songUrl = options.getString('url');

          if (!songName && !songUrl) {
            throw 'Please provide either song name or song url to begin playing song';
          }

          if (songName) {
            embed.setDescription(`🔍 Searching **${songName}**`);
          }

          if (songUrl) {
            embed.setDescription('🔍 Finding song url');
          }

          await interaction.reply({ embeds: [embed] });

          await queue.join(channel);
          await queue.play((songName || songUrl)!, {
            requestedBy: interaction.user,
          });

          await interaction.deleteReply();
        } catch (err) {
          if (!guildQueue) queue.stop();
          errorHandler({ err, interaction });
        }
      },

      skip: async () => {
        const currentSong = guildQueue?.skip();

        if (!currentSong) {
          throw 'There is no song playing right now';
        }

        embed.setDescription(`Skipping ${currentSong.name}`);
        await interaction.reply({ embeds: [embed] });
      },

      stop: async () => {
        if (!guildQueue) {
          throw 'There is no song playing right now';
        }

        guildQueue.stop();
      },

      'now-playing': async () => {
        const currentSong = guildQueue?.nowPlaying;

        if (!currentSong) {
          throw 'There is no song playing right now';
        }

        embed.setThumbnail(currentSong.thumbnail);
        embed.setTitle(`🎵 Now Playing ${currentSong.name}`);
        embed.setDescription(`Requested by ${currentSong.requestedBy}`);
        embed.setURL(currentSong.url);

        await interaction.reply({ embeds: [embed] });
      },
    };

    const subcommandName = options.getSubcommand(true);
    await subcommandHandlers[subcommandName]();
  },
};

export default song;
