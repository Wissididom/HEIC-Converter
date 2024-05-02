import "dotenv/config";
import { REST, Routes, SlashCommandBuilder } from "discord.js";

const rest = new REST().setToken(process.env.TOKEN);

let commands = [
  new SlashCommandBuilder()
    .setName("heictojpg")
    .setDescription("Converts an heic image to an jpg image")
    .addAttachmentOption((option) =>
      option
        .setName("image")
        .setDescription("The image you want to convert")
        .setRequired(true),
    )
    .addBooleanOption((option) =>
      option
        .setName("public")
        .setDescription("Whether you want to share the response publicly")
        .setRequired(false),
    ),
];

(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`,
    );
    const userData = await rest.get(Routes.user());
    const userId = userData.id;
    const data = await rest.put(Routes.applicationCommands(userId), {
      body: commands,
    });
    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`,
    );
  } catch (err) {
    console.error(err);
  }
})();
