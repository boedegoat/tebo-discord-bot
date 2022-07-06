import { Guild } from 'discord.js';

interface Props {
    guild: Guild | null
    channelId: string
}

const getGuildChannel = ({ guild, channelId }: Props) => {
  const channel = guild?.channels.cache.get(channelId);

  if (!channel) {
    throw 'Channel not found for unknown reason';
  }

  return channel;
};

export default getGuildChannel;
