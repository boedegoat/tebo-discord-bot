import { Client } from 'discord.js';
import onInteraction from './events/onInteraction';
import onReady from './events/onReady';
import runWebServer from './server';

// CLIENT -> bot / user
// GUILD -> discord server

// eslint-disable-next-line import/prefer-default-export
export const bot = new Client({
  intents: ['GUILDS', 'GUILD_VOICE_STATES', 'GUILD_MEMBERS'], // tell Discord what events your bot should receive.
});

bot.on('ready', onReady);

bot.on('interactionCreate', onInteraction);

bot.login(process.env.TOKEN);

runWebServer();
