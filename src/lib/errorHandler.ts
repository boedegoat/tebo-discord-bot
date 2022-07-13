import createEmbed from './createEmbed';

// TODO: change props type
const errorHandler = ({ err, interaction }: any) => {
  console.log({ err, date: new Date().toLocaleString() });
  let errMsg = '';

  if (err instanceof Error) {
    errMsg = `${err.message}${!err.message.endsWith('.') ? '.' : ''}`;
    switch (err.message) {
      case 'Missing Permissions':
        errMsg += ' Can not do operations to user that has equal or higher permission than me.';
        break;
      default:
            //
    }
  } else {
    errMsg = err || 'Something went wrong 😢. Please try again or report to my developer.';
  }

  const embed = createEmbed('error');
  embed.setDescription(errMsg);

  interaction.editReply({ embeds: [embed] }).catch(() => {
    interaction.reply({ embeds: [embed] });
  });
};

export default errorHandler;
