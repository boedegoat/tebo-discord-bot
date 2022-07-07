import { Client } from 'discord.js';
import express from 'express';
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

// web server
const app = express();

app.get('/', (req, res) => {
  res.json({
    app: 'Tebo Discord Bot',
    inviteToServer: 'https://tebo-discord-bot.herokuapp.com/invite',
    version: process.env.npm_package_version,
    author: 'https://github.com/boedegoat',
  });
});

app.get('/invite', (req, res) => {
  res.redirect('https://discord.com/api/oauth2/authorize?client_id=863731372572934145&permissions=8&scope=bot%20applications.commands');
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running on port ${port}`));
