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

// TODO: add loop, queue loop, create progress bar, play playlist
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
      .setName('pause')
      .setDescription('Pause current song'))
    .addSubcommand((subcommand) => subcommand
      .setName('resume')
      .setDescription('resume current song'))
    .addSubcommand((subcommand) => subcommand
      .setName('skip')
      .setDescription('Skip current song and play next song in queue'))
    .addSubcommand((subcommand) => subcommand
      .setName('stop')
      .setDescription('Stop playing song'))
    .addSubcommand((subcommand) => subcommand
      .setName('now-playing')
      .setDescription('Get current song playing'))
    .addSubcommand((subcommand) => subcommand
      .setName('help')
      .setDescription('Provide guides for using /music command')),

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

      pause: async () => {
        const currentSong = guildQueue?.nowPlaying;
        if (!currentSong) {
          throw 'There is no song playing right now';
        }

        guildQueue.setPaused(true);

        embed.setDescription(`${currentSong.name} ⏸ paused`);
        await interaction.reply({ embeds: [embed] });
      },

      resume: async () => {
        const currentSong = guildQueue?.nowPlaying;
        if (!currentSong) {
          throw 'There is no song playing right now';
        }

        guildQueue.setPaused(false);

        embed.setDescription(`${currentSong.name} ▶ resumed`);
        await interaction.reply({ embeds: [embed] });
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
        embed.setDescription('Stopping music player');
        await interaction.reply({ embeds: [embed] });
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

      help: async () => {
        const songOptions = song.data.toJSON().options!;
        embed.setTitle(`/song Guides (${songOptions.length} commands)`);
        embed.addFields(songOptions.map((songOption) => ({
          name: `/${songOption.name}`,
          value: songOption.description,
        })));
        await interaction.reply({ embeds: [embed] });
      },
    };

    const subcommandName = options.getSubcommand(true);
    await subcommandHandlers[subcommandName]();
  },
};

export default song;
