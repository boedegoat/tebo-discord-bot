import { Guild, User } from 'discord.js';

interface Props {
    guild: Guild | null
    user: User
}

const getGuildMember = async ({ guild, user }: Props) => {
  const member = await guild?.members.fetch({ user });

  if (!member) {
    throw 'User not found for unknown reason';
  }

  return member;
};

export default getGuildMember;
