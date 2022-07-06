import { Interaction } from 'discord.js';
import commands from '../commands/_commands';
import createEmbed from '../lib/createEmbed';

const onInteraction = async (interaction: Interaction) => {
  if (!interaction.isCommand()) return;

  const command = commands.find((c) => c.data.name === interaction.commandName);
  if (command) {
    try {
      await interaction.deferReply({ ephemeral: command.ephemeral ?? false });
      await command.run(interaction);
    } catch (err: any) {
      console.log(err);
      let errMsg = '';

      if (err instanceof Error) {
        errMsg = `${err.message}${!err.message.endsWith('.') ? '.' : ''}`;
        switch (err.message) {
          case 'Missing Permissions':
            errMsg += ' Can not do operations to user that has higher permission than me.';
            break;
          default:
            //
        }
      } else {
        errMsg = err || 'Something went wrong 😢. Please try again or report to my developer.';
      }

      const embed = createEmbed()
        .setColor('RED')
        .setTitle('Error')
        .setDescription(errMsg);

      interaction.editReply({ embeds: [embed] });
    }
  }
};

export default onInteraction;
