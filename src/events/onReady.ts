import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { Client } from 'discord.js';
import readCommands from '../lib/readCommands';
import commands from '../commands/_commands';

const onReady = async (bot: Client) => {
  console.log('🤖 Running bot...');

  bot.user?.setActivity({
    type: 'LISTENING',
    name: '/help',
  });

  const botId = bot.user?.id || 'missing id';
  const guildId = process.env.GUILD_ID!;
  const clientId = process.env.CLIENT_ID!;

  // REST -> instantiate an API client,
  //         which you'll use to send the commands to discord server.
  const rest = new REST({ version: '9' }).setToken(process.env.TOKEN!);

  // The API expects command data to be sent in json
  commands.push(...(await readCommands()));
  const commandData = commands.map((command) => command.data.toJSON());

  // create a put request to create or overwrite any existing commands

  // register guild commands
  await rest.put(Routes.applicationGuildCommands(botId, guildId), {
    body: commandData,
  });

  // register global commands (aprox 1 hour to register)
  await rest.put(Routes.applicationCommands(clientId), {
    body: commandData,
  });

  console.log(`✅ ${commands.length} Commands registered`);

  console.log('⚡ Bot Ready');
  console.log(`🟢 Logged in as ${bot.user?.tag}`);
};

export default onReady;
