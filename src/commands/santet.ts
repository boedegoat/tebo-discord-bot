import { SlashCommandBuilder } from '@discordjs/builders';
import {
  Collection, CommandInteraction, GuildMember,
} from 'discord.js';
import Command from '../interfaces/Command';
import createEmbed from '../lib/createEmbed';
import getGuildChannel from '../lib/getGuildChannel';
import getGuildMember from '../lib/getGuildMember';
import { bot } from '..';

type SantetQueue = {
    targetMember: GuildMember
    senderMember: GuildMember
}[]
interface RunSantetProps {
    interaction: CommandInteraction
    loop: number
    targetMember: GuildMember
    senderMember: GuildMember
}
interface ResetSantetProps { userId: string }

let santetQueue: SantetQueue = [];

const resetSantet = ({ userId }: ResetSantetProps) => {
  santetQueue = santetQueue.filter(({ targetMember }) => targetMember.user.id !== userId);
};

const runSantet = async ({
  interaction, loop, targetMember, senderMember,
}: RunSantetProps) => {
  // check if targetMember user id is in santetQueue
  if (santetQueue.find((data) => data.targetMember.user.id === targetMember.user.id)) {
    throw 'You can\'t perform santet on a user who is being santet';
  }

  const targetMemberRoles = targetMember.roles.cache;

  if (targetMemberRoles.size === 1) {
    throw 'Please add at least one role to the user you targeted';
  }

  const targetMemberRolesArray = [...targetMemberRoles].map(([, roleData]) => roleData);

  const [roleToAddBack, everyoneRole] = targetMemberRolesArray.slice(
    targetMemberRolesArray.length - 2,
  );

  // check if @everyone role has 'Use Voice Activity' permission, tell them to disable it
  if (everyoneRole.permissions.has('USE_VAD')) {
    throw `Please disable 'Use Voice Activity' permission on ${everyoneRole.toString()} role in order to make this command works as expected`;
  }

  //  check if role to add back doesn't has 'Use Voice Activity' permisson, tell them to enable it
  if (!roleToAddBack.permissions.has('USE_VAD')) {
    throw `Please enable 'Use Voice Activity' permission on ${roleToAddBack.toString()} role in order to make this command works as expected`;
  }

  // check if bot has 'Manage Role' permission
  const botMember = getGuildMember({ guild: interaction.guild, userId: bot.user?.id });
  if (!botMember.permissions.has('MANAGE_ROLES')) {
    throw "Please make sure I have 'Manage Role' permission";
  }

  // check if target user role is higher than bot
  if (botMember.roles.highest.position <= targetMember.roles.highest.position) {
    throw `Can't santet ${targetMember.user.toString()} because his/her role is equal or higher than me`;
  }

  const embed = createEmbed();
  embed.setColor('RED');
  embed.setDescription(`Santeting ${targetMember.user.toString()} ${loop} times...`);
  await interaction.editReply({ embeds: [embed] });

  // execute santet loop
  santetQueue.push({ targetMember, senderMember });
  for (let times = 1; times <= Math.round(loop / 2); times += 1) {
    if (!santetQueue.find((data) => data.targetMember === targetMember)) break;
    await targetMember.roles.remove(targetMemberRoles);
    await targetMember.roles.add(roleToAddBack);
  }
  resetSantet({ userId: targetMember.user.id });

  embed.setColor('GREEN');
  embed.setDescription(`Santet ${targetMember.user.toString()} ${loop} times done`);
  interaction.editReply({ embeds: [embed] });
};

const santet: Command = {
  ephemeral: true,
  data: new SlashCommandBuilder()
    .setName('santet')
    .setDescription('This one is a little bit sacred. Use it wisely 😈')
    .addUserOption((option) => option
      .setName('target-user')
      .setDescription('Who do you want to santet ?'))
    .addNumberOption((option) => option
      .setName('loop')
      .setDescription('How many times you want to santet him/her ?')
      .setMinValue(5))
    .addUserOption((option) => option
      .setName('stop-user')
      .setDescription('Stop current ongoing santet by user')),

  run: async (interaction) => {
    const { options, guild } = interaction;

    const senderUser = interaction.user;

    const stopUser = options.getUser('stop-user');

    // handle santet stop
    if (stopUser) {
      const santetData = santetQueue.find(
        ({ targetMember }) => targetMember.user.id === stopUser.id,
      );

      if (!santetData) {
        throw `${stopUser.toString()} is not being santet`;
      }

      if (senderUser.id !== santetData.senderMember.user.id) {
        throw 'Stopping current ongoing santet can only be performed by penyantet.';
      }

      const { targetMember } = santetData;
      resetSantet({ userId: targetMember.user.id });

      const embed = createEmbed();
      embed.setDescription(`Santet ${targetMember.user.toString()} stopped`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    const loop = options.getNumber('loop') ?? 20;
    const targetUser = options.getUser('target-user');
    const senderMember = getGuildMember({ guild, userId: senderUser.id });

    // if sender specify target-user
    if (targetUser) {
      if (targetUser.bot) {
        throw "You can't santet a bot";
      }

      // check if targeted user is bot creator
      if (targetUser.id === process.env.CREATOR_ID) {
        throw "You can't santet my creator";
      }

      const targetMember = getGuildMember({ guild, userId: targetUser.id });

      await runSantet({
        interaction, loop, targetMember, senderMember,
      });
      return;
    }

    // if target-user is not specified, perform random santet to user inside voice channel

    const senderCurrentVoiceChannelId = senderMember.voice.channelId;
    if (!senderCurrentVoiceChannelId) {
      throw 'If you are not specify target-user, please join to voice channel so I can santet random people there';
    }

    const voiceChannel = getGuildChannel({
      guild,
      channelId: senderCurrentVoiceChannelId,
    });

    const voiceChannelMembers = voiceChannel?.members as Collection<string, GuildMember>;

    const voiceChannelMembersArray = [...voiceChannelMembers]
      .map(([, data]) => data)
      .filter((member) => !member.user.bot
        && member.user.id !== process.env.CREATOR_ID
        && !(member.user.id in santetQueue));

    if (voiceChannelMembersArray.length === 0) {
      throw 'There is no users who I can santet here\nOr you can use /santet <target-user> instead';
    }

    const randomMember = voiceChannelMembersArray[
      Math.floor(Math.random() * voiceChannelMembersArray.length)
    ];

    await runSantet({
      interaction, loop, targetMember: randomMember, senderMember,
    });
  },
};

export default santet;
