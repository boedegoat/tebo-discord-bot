import { SlashCommandBuilder } from '@discordjs/builders';
import Command from '../interfaces/Command';

const edit: Command = {
  category: 'Fun',
  data: new SlashCommandBuilder()
    .setName('edit')
    .setDescription('Edit ping message')
    .addStringOption((option) => option
      .setName('embed-id')
      .setDescription('id of embed to edit')
      .setRequired(true))
    .addStringOption((option) => option
      .setName('message')
      .setDescription('new message')
      .setRequired(true)),
  run: async (interaction) => {
    const { channel, options, user } = interaction;

    const embedId = options.getString('embed-id', true);
    const newMessage = options.getString('message', true);

    // discord only waits to reply for 3s, more than that -> use this
    await interaction.deferReply();

    // check if this interaction sent via server/guild channel (not dm)
    if (!channel) {
      await interaction.reply('You cannot run this command on DM');
      return;
    }

    // check if message exist
    const targetMessage = await channel.messages.fetch(embedId);
    if (!targetMessage) {
      await interaction.reply('Seems like the embed id is not found. Be sure that you are using this command in the same channel as the message.');
      return;
    }

    // check if the message belongs to user
    const [targetEmbed] = targetMessage.embeds;
    if (targetEmbed.author?.name !== user.tag) {
      await interaction.reply("You can't edit other user message");
      return;
    }

    targetEmbed.setDescription(newMessage);
    await targetMessage.edit({ embeds: [targetEmbed] });
    interaction.editReply('Edited');
  },
};

export default edit;
