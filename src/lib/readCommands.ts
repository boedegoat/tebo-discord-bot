import fs from 'fs/promises';
import path from 'path';
import Command from '../interfaces/Command';

const readCommands = async () => {
  const commandsDirPath = path.join(__dirname, '../commands');
  const commandFiles = await fs.readdir(commandsDirPath);

  return Promise.all(commandFiles
    .filter((commandFileName) => !commandFileName.startsWith('_'))
    .map(async (commandFileName) => {
      const commandFilePath = path.join(commandsDirPath, commandFileName);
      const command = (await import(commandFilePath)).default as Command;
      if (!command) {
        throw new Error(`Don't forget to export default your command handler on 📁commands/${commandFileName}`);
      }
      return command;
    }));
};

export default readCommands;
