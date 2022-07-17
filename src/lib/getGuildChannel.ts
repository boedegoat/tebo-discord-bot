import { Guild } from 'discord.js';

interface Props {
    guild: Guild | null
    channelId: string
}

const getGuildChannel = async ({ guild, channelId }: Props) => {
  const channel = await guild?.channels.fetch(channelId, { force: true });

  if (!channel) {
    throw 'Channel not found for unknown reason';
  }

  return channel;
};

export default getGuildChannel;
