import { Playlist, Queue, Song } from 'discord-music-player';
import { MessageEmbed } from 'discord.js';
import createEmbed from './createEmbed';

// eslint-disable-next-line no-unused-vars
type SongHandler = (queue: Queue, song: Song) => Promise<void>
// eslint-disable-next-line no-unused-vars
type QueueHandler = (queue: Queue) => Promise<void>
// eslint-disable-next-line no-unused-vars
type PlaylistHandler = (queue: Queue, playlist: Playlist) => Promise<void>

// eslint-disable-next-line no-unused-vars
const reply = async (queue: Queue, embedCallback: (embed: MessageEmbed) => MessageEmbed) => {
  const { interaction } = queue.data;
  const embed = embedCallback(createEmbed());
  await interaction.channel.send({ embeds: [embed] });
};

export const onAddToQueue: SongHandler = async (queue, song) => {
  if (queue.songs.length === 1) return;
  await reply(queue, (embed) => embed
    .setDescription(`**${song.name}** added to queue`));
};

export const onSongPlayed: SongHandler = async (queue, song) => {
  await reply(queue, (embed) => embed
    .setThumbnail(song.thumbnail)
    .setTitle(`🎵 Playing ${song.name}`)
    .setDescription(`Requested by ${song.requestedBy}`)
    .setURL(song.url));
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
    .setDescription(`Playlist ${playlist} with ${playlist.songs.length} added to the queue`));
};

export const onClientDisconnect: QueueHandler = async (queue) => {
  await reply(queue, (embed) => embed
    .setDescription('I was kicked from the Voice Channel, song queue ended'));
};

export const onClientUndeafen: QueueHandler = async (queue) => {
  await reply(queue, (embed) => embed
    .setDescription('I got undefeanded'));
};
