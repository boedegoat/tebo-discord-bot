import { Client } from 'discord.js';
import onInteraction from './events/onInteraction';
import onReady from './events/onReady';

// CLIENT -> bot / user
// GUILD -> discord server

// eslint-disable-next-line import/prefer-default-export
export const bot = new Client({
  intents: ['GUILDS', 'GUILD_VOICE_STATES'], // tell Discord what events your bot should receive.
});

bot.on('ready', onReady);

bot.on('interactionCreate', onInteraction);

bot.login(process.env.TOKEN);
