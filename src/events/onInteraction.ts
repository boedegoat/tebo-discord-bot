import http from 'http';
import { Interaction } from 'discord.js';
import commands from '../commands/_commands';
import errorHandler from '../lib/errorHandler';
import { getAppName } from '../lib/utils';

const appName = getAppName();

const onInteraction = async (interaction: Interaction) => {
  if (!interaction.isCommand()) return;

  // ping server on each command interaction
  http.get(`http://${appName}`);

  const command = commands.find((c) => c.data.name === interaction.commandName);
  if (command) {
    try {
      const { useDeferReply = false, ephemeral = false } = command;
      if (useDeferReply) {
        await interaction.deferReply({ ephemeral });
      }
      await command.run(interaction);
    } catch (err: any) {
      errorHandler({ err, interaction });
    }
  }
};

export default onInteraction;
