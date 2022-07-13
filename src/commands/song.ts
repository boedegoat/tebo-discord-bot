import { SlashCommandBuilder } from '@discordjs/builders';
import {
  Player, RepeatMode, Song,
} from 'discord-music-player';
import { EmbedFieldData, GuildMember } from 'discord.js';
import { bot } from '..';
import Command from '../interfaces/Command';
import createEmbed from '../lib/createEmbed';
import * as handler from '../lib/songHandler';

type SubcommandHandlers = { [subcommand: string]: () => Promise<void> }

export const player = new Player(bot);

// music event handlers
player
  .on('songChanged', handler.onSongPlayed)
  .on('songFirst', handler.onSongPlayed)
  .on('channelEmpty', handler.onChannelEmpty)
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
        .setName('song-or-playlist')
        .setDescription('Gimme the song or playlist name/link')
        .setRequired(true)))

    .addSubcommand((subcommand) => subcommand
      .setName('pause')
      .setDescription('Pause current song'))

    .addSubcommand((subcommand) => subcommand
      .setName('resume')
      .setDescription('Resume current song'))

    .addSubcommand((subcommand) => subcommand
      .setName('skip')
      .setDescription('Skip current song and play next song in queue'))

    .addSubcommand((subcommand) => subcommand
      .setName('stop')
      .setDescription('Stop playing song'))

    .addSubcommand((subcommand) => subcommand
      .setName('loop')
      .setDescription('toggle loop current song'))

    .addSubcommand((subcommand) => subcommand
      .setName('shuffle')
      .setDescription('Shuffle song queue'))

    .addSubcommand((subcommand) => subcommand
      .setName('seek')
      .setDescription('Seeks/forward current song')
      .addNumberOption((option) => option
        .setName('seconds')
        .setDescription('How many seconds you want to seek/forward ?')
        .setMinValue(1)
        .setRequired(true)))

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

        const queue = player.createQueue(interaction.guildId!);
        queue.setData({ interaction });
        await queue.join(channel);

        const nameInput = options.getString('song-or-playlist', true);

        embed.setAuthor({
          name: '🔍 Searching',
        });
        embed.setDescription(`**${nameInput}**`);
        await interaction.reply({ embeds: [embed] });

        const songPlayed = await queue.play(nameInput, {
          requestedBy: interaction.user,
        }).catch(async (err) => {
          if (err.message === 'The was no YouTube song found by that query.') {
            return queue.playlist(nameInput, {
              requestedBy: interaction.user,
            });
          }
          return null;
        });

        if (!songPlayed) {
          throw 'song/playlist not found';
        }

        if (queue.songs.length === 1) {
          await interaction.deleteReply();
          return;
        }

        const queueEmbed = createEmbed();
        queueEmbed.setAuthor({
          name: 'Added to Queue',
          iconURL: interaction.user.avatarURL()!,
        });
        queueEmbed.setTitle(songPlayed.name);
        queueEmbed.setURL(songPlayed.url);

        let fields: EmbedFieldData[] = [];

        if (songPlayed instanceof Song) {
          queueEmbed.setThumbnail(songPlayed.thumbnail);
          fields = [...fields,
            {
              name: 'Channel',
              value: songPlayed.author,
              inline: true,
            },
            {
              name: 'Queue Position',
              value: `${songPlayed.queue.songs.findIndex((s) => s.url === songPlayed.url) + 1}`,
              inline: true,
            },
            {
              name: 'Duration',
              value: songPlayed.duration,
              inline: true,
            },
          ];
        } else {
          fields = [
            {
              name: 'Owner',
              value: songPlayed.author,
              inline: true,
            },
            {
              name: 'Songs',
              value: `${songPlayed.songs.length} songs`,
              inline: true,
            },
          ];
        }

        queueEmbed.setFields(fields);
        await interaction.editReply({ embeds: [queueEmbed] });
      },

      pause: async () => {
        const currentSong = guildQueue?.nowPlaying;
        if (!currentSong) {
          throw 'There is no song playing right now';
        }

        guildQueue.setPaused(true);

        embed.setDescription('⏸ Paused');
        await interaction.reply({ embeds: [embed] });
      },

      resume: async () => {
        const currentSong = guildQueue?.nowPlaying;
        if (!currentSong) {
          throw 'There is no song playing right now';
        }

        guildQueue.setPaused(false);

        embed.setDescription('▶ Resumed');
        await interaction.reply({ embeds: [embed] });
      },

      skip: async () => {
        const currentSong = guildQueue?.skip();

        if (!currentSong) {
          throw 'There is no song playing right now';
        }

        embed.setDescription('⏯ Song Skipped');
        await interaction.reply({ embeds: [embed] });
      },

      stop: async () => {
        if (!guildQueue) {
          throw 'There is no song playing right now';
        }

        guildQueue.stop();
        embed.setDescription('🛑 Song Queue Stopped');
        await interaction.reply({ embeds: [embed] });
      },

      'now-playing': async () => {
        const currentSong = guildQueue?.nowPlaying;

        if (!currentSong) {
          throw 'There is no song playing right now';
        }

        const progressBar = guildQueue.createProgressBar();

        embed
          .setAuthor({
            name: '🔊 Now Playing',
            iconURL: currentSong.requestedBy!.avatarURL()!,
          })
          .setImage(currentSong.thumbnail)
          .setTitle(currentSong.name)
          .setDescription(`Requested by ${currentSong.requestedBy}`)
          .setURL(currentSong.url)
          .setFields([
            {
              name: 'Channel',
              value: currentSong.author,
              inline: true,
            },
            {
              name: 'Duration',
              value: progressBar.times,
              inline: true,
            },
          ]);

        await interaction.reply({ embeds: [embed] });
      },

      loop: async () => {
        const currentSong = guildQueue?.nowPlaying;

        if (!currentSong) {
          throw 'There is no song playing right now';
        }

        if (guildQueue.repeatMode === RepeatMode.DISABLED) {
          guildQueue.setRepeatMode(RepeatMode.SONG);
          embed.setDescription('🔄 Looped');
        } else {
          guildQueue.setRepeatMode(RepeatMode.DISABLED);
          embed.setDescription('Loop disabled');
        }

        await interaction.reply({ embeds: [embed] });
      },

      shuffle: async () => {
        if (!guildQueue) {
          throw 'There is no song playing right now';
        }

        guildQueue.shuffle();
        embed.setDescription('🔁 Queue Shuffled');
        await interaction.reply({ embeds: [embed] });
      },

      seek: async () => {
        const currentSong = guildQueue?.nowPlaying;

        if (!currentSong) {
          throw 'There is no song playing right now';
        }

        const seconds = options.getNumber('seconds', true);

        const to = currentSong.seekTime + (seconds * 1000);

        await guildQueue.seek(to);

        embed.setTitle(`🎵 ${currentSong.name}`);
        embed.setThumbnail(currentSong.thumbnail);
        embed.setAuthor({ name: `⏩ Seeks ${seconds} second${seconds > 1 ? 's' : ''}` });
        embed.setDescription(guildQueue.createProgressBar().prettier);
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
