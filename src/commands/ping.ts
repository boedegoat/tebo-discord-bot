import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import Command from '../interfaces/Command';

const ping: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription("Ping you. That's it 👍")
    .addStringOption((option) => option
      .setName('emoji')
      .setDescription('emoji you want to use'))
    .addStringOption((option) => option
      .setName('message')
      .setDescription('random message to include')),

  run: async (interaction) => {
    const { user, options } = interaction;

    const emoji = options.getString('emoji');
    const message = options.getString('message');

    const embed = new MessageEmbed();
    embed.setColor('RED');
    embed.setTitle(`Ping ${emoji || ''}`);
    embed.setAuthor({
      name: user.tag,
      iconURL: user.displayAvatarURL(),
    });
    embed.setFooter({
      text: `ver ${process.env.npm_package_version}`,
    });

    if (message) {
      embed.setDescription(message);
    }

    interaction.reply({ embeds: [embed] });
  },
};

export default ping;
