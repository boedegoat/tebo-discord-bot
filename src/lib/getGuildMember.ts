import { Guild, GuildMember, UserResolvable } from 'discord.js';

interface Props {
    guild?: Guild | null
    user?: UserResolvable
}

const getGuildMember = async ({ guild, user }: Props) => {
  const member = await guild?.members.fetch({ user, force: true, limit: 1 });

  if (!member) {
    throw 'User not found. Make sure you are inside a discord server.';
  }

  // @ts-ignore
  return member as GuildMember;
};

export default getGuildMember;
