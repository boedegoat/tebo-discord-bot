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
    progress: string
    running: boolean
}
interface RunSantetProps {
    interaction: CommandInteraction
    loop: number
    targetMember: GuildMember
    senderMember: GuildMember
}

let santetQueue: SantetQueue[] = [];
const creatorId = '485048406398468108';

const editSantet = ({ userId, newData }: { userId: string, newData: any}) => {
  try {
    const index = santetQueue.findIndex((data) => data.targetMember.user.id === userId);
    santetQueue = [
      ...santetQueue.slice(0, index),
      { ...santetQueue[index], ...newData },
      ...santetQueue.slice(index + 1),
    ];
  } catch (err) {
    //
  }
};

const resetSantet = ({ userId }: { userId: string }) => {
  santetQueue = santetQueue.filter(({ targetMember }) => targetMember.user.id !== userId);
};

const runSantet = async ({
  interaction, loop, targetMember, senderMember,
}: RunSantetProps) => {
  // check if targetMember user id is in santetQueue
  const santetExist = santetQueue.find(
    (data) => data.targetMember.user.id === targetMember.user.id,
  );
  if (santetExist) {
    const embed = createEmbed();
    embed.setDescription(`Santeting ${targetMember.user}: ${santetExist.progress}`);
    await interaction.reply({ embeds: [embed] });
    return;
  }

  const targetMemberRoles = targetMember.roles.cache;

  if (targetMemberRoles.size === 1) {
    const errEmbed = createEmbed('error');
    errEmbed.setDescription(`Please add at least one role to ${targetMember.user.toString()}`);
    await interaction.reply({ embeds: [errEmbed] }).catch(
      () => interaction.followUp({ embeds: [errEmbed] }),
    );
    return;
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
  await interaction.reply({ embeds: [embed] }).catch(
    () => interaction.followUp({ embeds: [embed] }),
  );

  // execute santet loop
  santetQueue.push({
    targetMember, senderMember, progress: `0/${loop}`, running: true,
  });

  for (let times = 1; times <= Math.round(loop); times += 2) {
    // console.log(santetQueue);
    if (santetQueue.find(
      (data) => data.targetMember.user.id === targetMember.user.id,
    )?.running === false) break;

    await targetMember.roles.remove(targetMemberRoles);
    editSantet({ userId: targetMember.user.id, newData: { progress: `${times}/${loop}` } });
    await targetMember.roles.add(roleToAddBack);
    editSantet({ userId: targetMember.user.id, newData: { progress: `${times + 1}/${loop}` } });
  }
  resetSantet({ userId: targetMember.user.id });

  embed.setColor('GREEN');
  embed.setDescription(`Santet ${targetMember.user.toString()} ${loop} times done`);
  await interaction.followUp({ embeds: [embed] });
};

const santet: Command = {

  data: new SlashCommandBuilder()
    .setName('santet')
    .setDescription('This one is a little bit sacred. Use it wisely 😈')
    .addUserOption((option) => option
      .setName('target-user')
      .setDescription('Who do you want to santet ?'))
    .addIntegerOption((option) => option
      .setName('loop')
      .setDescription('How many times you want to santet him/her ?')
      .setMinValue(5))
    .addUserOption((option) => option
      .setName('stop-user')
      .setDescription('Stop current ongoing santet by user'))
    .addBooleanOption((option) => option
      .setName('massal')
      .setDescription('Perform santet massal (select True to continue)')),

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
      editSantet({ userId: targetMember.user.id, newData: { running: false } });

      const embed = createEmbed();
      embed.setDescription(`Santet ${targetMember.user.toString()} stopped`);
      await interaction.reply({ embeds: [embed] });
      return;
    }

    const loop = options.getInteger('loop') ?? 20;
    const targetUser = options.getUser('target-user');
    const senderMember = getGuildMember({ guild, userId: senderUser.id });

    // if sender specify target-user
    if (targetUser) {
      if (targetUser.bot) {
        throw "You can't santet a bot";
      }

      // check if targeted user is bot creator
      if (targetUser.id === creatorId) {
        throw "You can't santet my creator";
      }

      const targetMember = getGuildMember({ guild, userId: targetUser.id });

      await runSantet({
        interaction, loop, targetMember, senderMember,
      });
      return;
    }

    // if target-user is not specified, perform the rest

    const senderCurrentVoiceChannelId = senderMember.voice.channelId;
    if (!senderCurrentVoiceChannelId) {
      throw 'If you are not specify target-user, please join to voice channel so I can santet to people there';
    }

    const voiceChannel = getGuildChannel({
      guild,
      channelId: senderCurrentVoiceChannelId,
    });

    const voiceChannelMembers = voiceChannel?.members as Collection<string, GuildMember>;

    const botMember = getGuildMember({ guild, userId: bot.user!.id });
    let voiceChannelMembersArray = [...voiceChannelMembers]
      .map(([, data]) => data)
      .filter((member) => !member.user.bot
        && member.user.id !== creatorId
        && !santetQueue.find((data) => data.targetMember.user.id === member.user.id)
        && member.roles.highest.position < botMember.roles.highest.position);

    if (voiceChannelMembersArray.length === 0) {
      throw 'There is no users who I can santet here\nOr you can use /santet <target-user> instead';
    }

    const santetMassal = options.getBoolean('massal');

    if (santetMassal) {
      // santet all people
      await Promise.all(voiceChannelMembersArray
        .map((member) => runSantet({
          interaction,
          loop,
          targetMember: member,
          senderMember,
        })));
      return;
    }

    voiceChannelMembersArray = voiceChannelMembersArray.filter((
      (member) => member.roles.cache.size > 1));

    const randomMember = voiceChannelMembersArray[
      Math.floor(Math.random() * voiceChannelMembersArray.length)
    ];

    await runSantet({
      interaction, loop, targetMember: randomMember, senderMember,
    });
  },
};

export default santet;
