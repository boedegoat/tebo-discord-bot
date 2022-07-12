import { SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from '@discordjs/builders';
import { CommandInteraction } from 'discord.js';

type CommandCategory = 'Fun' | 'Game'

// Omit -> remove some properties from a type
export default interface Command {
    data: Omit<SlashCommandBuilder, 'addSubcommandGroup' | 'addSubcommand'> | SlashCommandSubcommandsOnlyBuilder;
    // eslint-disable-next-line no-unused-vars
    run: (interaction: CommandInteraction) => Promise<void>;
    category?: CommandCategory
    /**
     * If sets to `true`, only the sender who can see the reply message.
     *
     * default : `false`
     */
    ephemeral?: boolean
    /**
     * If sets to `true`, the reply will be defered.
     *
     * default : `false`
     */
    useDeferReply?: boolean
// eslint-disable-next-line semi
}
