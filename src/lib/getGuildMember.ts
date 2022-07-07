import { Guild } from 'discord.js';

interface Props {
    guild?: Guild | null
    userId?: string
}

const getGuildMember = ({ guild, userId }: Props) => {
  const member = guild?.members.cache.get(userId ?? '');

  if (!member) {
    throw 'User not found for unknown reason';
  }

  return member;
};

export default getGuildMember;
