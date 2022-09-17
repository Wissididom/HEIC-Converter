require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const convert = require('heic-convert');
const bot = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages], partials: [Partials.User, Partials.Channels, Partials.GuildMemeber, Partials.Message, Partials.Reaction]});
const token = process.env['TOKEN'];

bot.on('ready', () => {
	console.log(`Logged in as ${bot.user.tag}!`);
});

bot.on('messageCreate', async (message) => {
	if (message.author.bot) return;
	message.attachments.forEach(async attachment => {
		console.log(attachment.name);
		if (attachment.name.endsWith('.heic')) {
			let webhook = await message.channel.createWebhook('HEIC-Converter');
			console.log(attachment.id);
			console.log(attachment.url);
			const heicBuffer = await (await fetch(attachment.url)).buffer();
			// console.log(heicBuffer.toString('base64'));
			const jpgBuffer = await convert({
				buffer: heicBuffer,
				format: 'JPEG',
				quality: 1
			});
			// console.log(pngBuffer.toString('base64'));
			// console.log((pngBuffer.length / 1024) + 'KB');
			// console.log((pngBuffer.length / 1024 / 1024) + 'MB');
			await webhook.send({
				username: (message.guild ? message.member.displayName : message.author.username),
				avatarURL: message.author.displayAvatarURL({ dynamic: true }),
				files: [
					{
						attachment: jpgBuffer,
						name: `${attachment.name}.jpg`
					}
				]
			}).then((message) => {
				console.log('Message sent!');
			}).catch(err => console.error);
			await webhook.delete().then(() => {
				console.log('Webhook deleted!');
			}).catch(err => console.error);
		}
	});
});
bot.login(token);
