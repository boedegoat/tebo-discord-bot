import { MessageEmbed } from 'discord.js';
import { bot } from '..';

const createEmbed = () => new MessageEmbed()
  .setColor('RANDOM')
  .setFooter({
    text: `bot version ${process.env.npm_package_version}`,
    iconURL: bot.user?.displayAvatarURL(),
  });

export default createEmbed;
