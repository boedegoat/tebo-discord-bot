import { Interaction } from 'discord.js';
import commands from '../commands/_commands';
import errorHandler from '../lib/errorHandler';

const onInteraction = async (interaction: Interaction) => {
  if (!interaction.isCommand()) return;

  const command = commands.find((c) => c.data.name === interaction.commandName);
  if (command) {
    try {
      await interaction.deferReply({ ephemeral: command.ephemeral ?? false });
      await command.run(interaction);
    } catch (err: any) {
      errorHandler({ err, interaction });
    }
  }
};

export default onInteraction;
