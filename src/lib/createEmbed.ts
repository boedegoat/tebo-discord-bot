import { ColorResolvable, MessageEmbed } from 'discord.js';
import { bot } from '..';

type ErrorType = 'error'
type Types = {
    [type: string]: {
        title?: string
        color?: ColorResolvable
    }
}

const createEmbed = (type?: ErrorType) => {
  const embed = new MessageEmbed();
  embed.setFooter({
    text: `bot version ${process.env.npm_package_version}`,
    iconURL: bot.user?.displayAvatarURL(),
  });

  const types: Types = {
    error: {
      title: 'Error',
      color: 'RED',
    },
  };

  if (type && type in types) {
    const { title, color } = types[type];
    if (title) embed.setTitle(title);
    if (color) embed.setColor(color);
  } else {
    embed.setColor('RANDOM');
  }

  return embed;
};

export default createEmbed;
