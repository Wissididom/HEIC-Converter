import "dotenv/config";
import { Client, Events, GatewayIntentBits, Partials } from "discord.js";
import convert from "heic-convert";
import { fileTypeFromBuffer } from "file-type";

const bot = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.User,
    Partials.Channels,
    Partials.GuildMemeber,
    Partials.Message,
    Partials.Reaction,
  ],
});

process.on("unhandledRejection", (reason, promise) => {
  console.error(reason, "Unhandled Rejection at Promise", promise);
});
process.on("uncaughtException", (err) => {
  console.error(err, "Uncaught Exception thrown", err.stack);
});

bot.on(Events.ClientReady, () => {
  console.log(`Logged in as ${bot.user.tag}!`);
});

bot.on(Events.InteractionCreate, async (interaction) => {
  let ephemeral = !(interaction.options.getBoolean("public") ?? false);
  await interaction.deferReply({ ephemeral });
  let attachment = interaction.options.getAttachment("image");
  if (attachment) {
    if (
      attachment.name.endsWith(".heic") ||
      attachment.contentType == "image/heic"
    ) {
      console.log(attachment.id);
      console.log(attachment.url);
      const fetchResponse = await fetch(attachment.url).catch((err) => {
        console.error(JSON.stringify(err));
      });
      // console.log('fetchResponse ' + fetchResponse.status);
      const heicBuffer = Buffer.from(
        await fetchResponse
          .arrayBuffer()
          .catch((err) => console.error(JSON.stringify(err))),
      );
      // console.log(heicBuffer.toString('base64'));
      let fileType = await fileTypeFromBuffer(heicBuffer).catch((err) =>
        console.error(JSON.stringify(err)),
      );
      console.log(fileType);
      if (fileType?.mime == "image/heic") {
        const jpgBuffer = await convert({
          buffer: heicBuffer,
          format: "JPEG",
          quality: 1,
        }).catch((err) => console.error(JSON.stringify(err)));
        // console.log(jpgBuffer.toString('base64'));
        // console.log((jpgBuffer.length / 1024) + 'KB');
        // console.log((jpgBuffer.length / 1024 / 1024) + 'MB');
        await interaction
          .editReply({
            content: `Successfully converted ${attachment.name} from heic to jpg`,
            files: [
              {
                attachment: jpgBuffer,
                name: `${attachment.name}.jpg`,
              },
            ],
          })
          .catch((err) => console.error(JSON.stringify(err)));
      } else {
        console.log(attachment.name);
        if (fileType) {
          await interaction.editReply({
            content: `This is not an HEIC file! It's extension should be \`.${fileType.ext}\` (Mime-Type: \`${fileType.mime}\`)`,
          });
        } else {
          await interaction.editReply({
            content: `This is not an HEIC file! It's extension should be one of the below:\n- \`.heic\` (Mime-Type: \`image/heic\`)`,
          });
        }
      }
    } else {
      console.log(attachment.name);
      await interaction.editReply({
        content: `This is not an HEIC file! It's extension should be one of the below:\n- \`.heic\` (Mime-Type: \`image/heic\`)`,
      });
    }
  }
});

bot.login(process.env.TOKEN);
