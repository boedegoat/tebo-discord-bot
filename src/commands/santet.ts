import { SlashCommandBuilder } from '@discordjs/builders';
import {
  Collection, CommandInteraction, GuildMember, User,
} from 'discord.js';
import Command from '../interfaces/Command';
import createEmbed from '../lib/createEmbed';
import errorHandler from '../lib/errorHandler';
import getGuildChannel from '../lib/getGuildChannel';
import getGuildMember from '../lib/getGuildMember';
import { bot } from '..';

let continueSantet = false;
let targetUser: User | null = null;
let senderUser: User | null = null;

const resetSantet = () => {
  continueSantet = false;
  targetUser = null;
  senderUser = null;
};

interface RunSantetProps {
    interaction: CommandInteraction
    loop: number
    targetMember?: GuildMember
}

const runSantet = async ({ interaction, loop, targetMember: targetMemberArg }: RunSantetProps) => {
  const embed = createEmbed();

  try {
    const { guild } = interaction;

    // get member instance of targeted user to access his/her roles
    let targetMember = targetMemberArg;
    if (!targetMember) {
      targetMember = getGuildMember({
        guild,
        userId: targetUser!.id,
      });
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
      throw "Please disable 'Use Voice Activity' permission on @everyone role in order to make this command works";
    }

    // check if bot has 'Manage Role' permission
    const botMember = getGuildMember({ guild: interaction.guild, userId: bot.user?.id });
    if (!botMember.permissions.has('MANAGE_ROLES')) {
      throw "Please make sure I have 'Manage Role' permission";
    }

    // check if target user role is higher than bot
    if (botMember.roles.highest.position <= targetMember.roles.highest.position) {
      throw `Can't santet ${targetUser?.toString()} because his/her role is equal or higher than me`;
    }

    embed.setColor('RED');
    embed.setDescription(`Santeting ${targetUser!.toString()} ${loop} times...`);
    await interaction.editReply({ embeds: [embed] });

    // execute santet loop
    continueSantet = true;
    for (let times = 1; times <= Math.round(loop / 2); times += 1) {
      if (!continueSantet) break;
      await targetMember.roles.remove(targetMemberRoles);
      await targetMember.roles.add(roleToAddBack);
    }

    embed.setColor('GREEN');
    embed.setDescription(`Santet ${targetUser!.toString()} ${loop} times done`);
    interaction.editReply({ embeds: [embed] });
  } catch (err: any) {
    errorHandler({ err, interaction });
  } finally {
    resetSantet();
  }
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
    .addBooleanOption((option) => option
      .setName('stop')
      .setDescription('Stop current ongoing santet (select True to continue)')),

  run: async (interaction) => {
    const { options, guild } = interaction;

    const stop = options.getBoolean('stop');
    if (stop) {
      if (!targetUser) {
        throw 'There is no user who is being santet';
      }
      if (senderUser !== interaction.user) {
        throw 'Only penyantet who can only stop the current santet';
      }

      resetSantet();

      const embed = createEmbed();
      embed.setDescription(`Santet ${targetUser.toString()} stopped`);
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    // if targetUser is not empty
    if (targetUser) {
      throw 'You can\'t perform santet on a user who is being santet';
    }

    targetUser = options.getUser('target-user');
    senderUser = interaction.user;
    const loop = options.getNumber('loop') ?? 20;

    // if sender specify target-user
    if (targetUser) {
      if (targetUser.bot) {
        throw "You can't santet a bot";
      }

      // check if targeted user is bot creator
      if (targetUser.id === process.env.CREATOR_ID) {
        throw "You can't santet my creator";
      }

      await runSantet({ interaction, loop });
      return;
    }

    // if target-user is not specified, perform random santet to user inside voice channel

    const senderMember = getGuildMember({
      guild,
      userId: senderUser.id,
    });

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
      .filter((member) => !member.user.bot && member.user.id !== process.env.CREATOR_ID);

    if (voiceChannelMembersArray.length === 0) {
      throw 'There is no users who I can santet here\nOr you can use /santet <target-user> instead';
    }

    const randomMember = voiceChannelMembersArray[
      Math.floor(Math.random() * voiceChannelMembersArray.length)
    ];

    targetUser = randomMember.user;
    await runSantet({ interaction, loop, targetMember: randomMember });
  },
};

export default santet;
