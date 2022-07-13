import { Playlist, Queue, Song } from 'discord-music-player';
import { Message, MessageEmbed } from 'discord.js';
import createEmbed from './createEmbed';

// eslint-disable-next-line no-unused-vars
type SongHandler = (queue: Queue, song: Song) => Promise<void>
// eslint-disable-next-line no-unused-vars
type QueueHandler = (queue: Queue) => Promise<void>
// eslint-disable-next-line no-unused-vars
type PlaylistHandler = (queue: Queue, playlist: Playlist) => Promise<void>

const reply = async (
  queue: Queue,
  // eslint-disable-next-line no-unused-vars
  embedCallback: (embed: MessageEmbed) => MessageEmbed,
): Promise<{ message: Message, embed: MessageEmbed}> => {
  const { interaction } = queue.data;
  const embed = embedCallback(createEmbed());
  const message = await interaction.channel.send({ embeds: [embed] });
  return { message, embed };
};

export const onSongPlayed: SongHandler = async (queue, song) => {
  await reply(queue, (embed) => embed
    .setAuthor({
      name: '🔊 Now Playing',
      iconURL: song.requestedBy!.avatarURL()!,
    })
    .setImage(song.thumbnail)
    .setTitle(song.name)
    .setDescription(`Requested by ${song.requestedBy}`)
    .setURL(song.url)
    .setFields([
      {
        name: 'Channel',
        value: song.author,
        inline: true,
      },
      {
        name: 'Duration',
        value: song.duration,
        inline: true,
      },
    ]));
};

export const onChannelEmpty: QueueHandler = async (queue) => {
  await reply(queue, (embed) => embed
    .setDescription('Everyone left the Voice Channel, song queue ended'));
};

export const onQueueEnd: QueueHandler = async (queue) => {
  await reply(queue, (embed) => embed
    .setDescription('The song queue has ended'));
};

export const onPlaylistAdd: PlaylistHandler = async (queue, playlist) => {
  await reply(queue, (embed) => embed
    .setDescription(`**Playlist ${playlist} (${playlist.songs.length} song${playlist.songs.length > 1 ? 's' : ''})** added to the queue`));
};

export const onClientDisconnect: QueueHandler = async (queue) => {
  await reply(queue, (embed) => embed
    .setDescription('I was kicked from the Voice Channel, song queue ended'));
};

export const onClientUndeafen: QueueHandler = async (queue) => {
  await reply(queue, (embed) => embed
    .setDescription('I got undefeanded'));
};
