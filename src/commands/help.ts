import { SlashCommandBuilder } from '@discordjs/builders';
import Command from '../interfaces/Command';
import createEmbed from '../lib/createEmbed';
import commands from './_commands';

const help: Command = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Provides guides for using this bot'),
  run: async (interaction) => {
    const embed = createEmbed();
    embed.setTitle(`Guides (${commands.length} commands)`);
    embed.setDescription('💡 tip:\nuse **arrow keys** for selecting different commands\nuse **tab** for selecting command parameters');
    embed.addFields(commands.map((command) => ({
      name: `/${command.data.name}`,
      value: command.data.description,
    })));
    interaction.reply({ embeds: [embed] });
  },
};

export default help;
