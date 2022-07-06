import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import Command from '../interfaces/Command';
import commands from './_commands';

const help: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Provides guides for using this bot'),
  run: async (interaction) => {
    const embed = new MessageEmbed();
    embed.setTitle('Learn Discord JS Bot Guides');
    embed.addFields(commands.map((command) => ({
      name: command.data.name,
      value: command.data.description,
    })));
    interaction.editReply({ embeds: [embed] });
  },
};

export default help;
