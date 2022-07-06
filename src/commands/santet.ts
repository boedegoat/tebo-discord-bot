import { SlashCommandBuilder } from '@discordjs/builders';
import Command from '../interfaces/Command';
import createEmbed from '../lib/createEmbed';

const santet: Command = {
  ephemeral: true,
  data: new SlashCommandBuilder()
    .setName('santet')
    .setDescription('This one is little bit sacred. Use it wisely 🦉')
    .addUserOption((option) => option
      .setName('target-user')
      .setDescription('Who do you want to santet ?')
      .setRequired(true))
    .addNumberOption((option) => option
      .setName('loop')
      .setDescription('How many times you want to santet him/her ?')
      .setMinValue(5)),

  run: async (interaction) => {
    const { options, channel, guild } = interaction;
    const targetUser = options.getUser('target-user', true);
    const loop = options.getNumber('loop') ?? 20;

    // check if this command is executed outside discord server
    if (!channel || !guild) {
      throw 'You can only run this command inside discord server';
    }

    if (targetUser.bot) {
      throw "You can't santet a bot";
    }

    // check if targeted user is bot creator
    if (targetUser.id === '485048406398468108') {
      throw "You can't santet my creator";
    }

    // get member instance of targeted user to access his/her roles
    const targetMember = await guild.members.fetch({ user: targetUser });
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

    const embed = createEmbed();
    embed.setColor('RED');
    embed.setDescription(`Santeting ${targetUser.toString()} ${loop} times...`);
    await interaction.editReply({ embeds: [embed] });

    // execute santet loop
    for (let times = 1; times <= Math.round(loop / 2); times += 1) {
      await targetMember.roles.remove(targetMemberRoles);
      await targetMember.roles.add(roleToAddBack);
    }

    embed.setColor('GREEN');
    embed.setDescription(`Santet ${targetUser.toString()} ${loop} times done`);
    interaction.editReply({ embeds: [embed] });
  },
};

export default santet;
