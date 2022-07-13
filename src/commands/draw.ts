import { SlashCommandBuilder } from '@discordjs/builders';
import axios from 'axios';
// @ts-ignore
import createCollage from '@settlin/collage';
// @ts-ignore
import Frame from 'canvas-to-buffer';
import { MessageAttachment } from 'discord.js';
import Command from '../interfaces/Command';
import createEmbed from '../lib/createEmbed';

const draw: Command = {
  data: new SlashCommandBuilder()
    .setName('draw')
    .setDescription('Change any text to images by using AI 🎨')
    .addStringOption((option) => option
      .setName('text')
      .setDescription('What do you want to see ? (e.g. super cozy bed next to beautiful waterfall)')
      .setRequired(true)),
  run: async (interaction) => {
    const { options, channel } = interaction;

    const text = options.getString('text', true);

    const drawEmbed = createEmbed();
    drawEmbed.setAuthor({
      name: '🎨 Drawing',
    });
    drawEmbed.setTitle(text);
    drawEmbed.setDescription('The more specific your text, the longer AI will take to draw, please be patient 👍');

    await interaction.reply({ embeds: [drawEmbed] });

    const startTime = Date.now();
    const { data } = await axios.post('https://bf.dallemini.ai/generate', {
      prompt: text,
    });
    const finishTime = Math.round((Date.now() - startTime) / 1000); // second

    // change image results to buffer
    const imageBuffers = (data.images as string[]).map((image) => Buffer.from(image, 'base64'));

    // create collage to combine image results
    const canvas = await createCollage({
      width: 3,
      height: 3,
      imageWidth: 300,
      imageHeight: 300,
      spacing: 20,
      sources: imageBuffers,
    });

    // create buffer from created canvas collage
    const canvasBuffer = new Frame(canvas).toBuffer();
    // then attach it
    const attachment = new MessageAttachment(canvasBuffer, `${text.replace(/ /g, '-')}.png`);

    const finishEmbed = createEmbed();
    finishEmbed.setAuthor({
      name: `✅ Drawing Finished in ${finishTime} seconds`,
    });
    finishEmbed.setTitle(text);
    finishEmbed.setDescription(`Requested by ${interaction.user}`);

    await interaction.deleteReply();

    const sendData = {
      embeds: [finishEmbed],
      files: [attachment],
    };

    if (channel) {
      await channel.send(sendData);
    } else {
      await interaction.reply(sendData);
    }
  },
};

export default draw;
