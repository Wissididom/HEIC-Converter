import * as dotenv from 'dotenv';
dotenv.config();
import { Client, GatewayIntentBits, Partials } from 'discord.js';
import convert from 'heic-convert';
import { fileTypeFromBuffer } from 'file-type';
const bot = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent], partials: [Partials.User, Partials.Channels, Partials.GuildMemeber, Partials.Message, Partials.Reaction]});
const token = process.env['TOKEN'];

process.on('unhandledRejection', (reason, promise) => {
	console.error(reason, 'Unhandled Rejection at Promise', promise);
});
process.on('uncaughtException', err => {
	console.error(err, 'Uncaught Exception thrown', err.stack);
});

bot.on('ready', () => {
	console.log(`Logged in as ${bot.user.tag}!`);
});

bot.on('messageCreate', async (message) => {
	if (message.author.bot) return;
	message.attachments.forEach(async attachment => {
		console.log(attachment.name);
		if (attachment.name.endsWith('.heic')) {
			const myWebhooks = (await message.channel.fetchWebhooks().catch(err => console.error(JSON.stringify(err)))).filter(webhook => webhook.owner.id == bot.user.id);
			for (let [id, webhook] of myWebhooks)
				await webhook.delete('Cleanup Webhooks').then(() => {
					console.log('Webhook deleted! (Cleanup)');
				}).catch(err => console.error(JSON.stringify(err)));
			console.log(attachment.id);
			console.log(attachment.url);
			const fetchResponse = await fetch(attachment.url).catch(err => console.error(JSON.stringify(err)));
			// console.log('fetchResponse ' + fetchResponse.status);
			const heicBuffer = Buffer.from(await fetchResponse.arrayBuffer().catch(err => console.error(JSON.stringify(err))));
			// console.log(heicBuffer.toString('base64'));
			let fileType = await fileTypeFromBuffer(heicBuffer).catch(err => console.error(JSON.stringify(err)));
			console.log(fileType);
			if (fileType.mime != 'image/heic')
				message.channel.send(`This is not an HEIC file! It's extension should be \`.${fileType.ext}\` (Mime-Type: \`${fileType.mime}\`)`).catch(err => console.error(JSON.stringify(err)));
			const jpgBuffer = await convert({
				buffer: heicBuffer,
				format: 'JPEG',
				quality: 1
			}).catch(err => console.error(JSON.stringify(err)));
			// console.log(jpgBuffer.toString('base64'));
			// console.log((jpgBuffer.length / 1024) + 'KB');
			// console.log((jpgBuffer.length / 1024 / 1024) + 'MB');
			let webhook = await message.channel.createWebhook({name: (message.guild ? message.member.displayName : message.author.username), avatar: message.author.displayAvatarURL({ dynamic: true }), reason: 'HEIC-Converter'}).catch(err => console.error(JSON.stringify(err)));
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
			}).catch(err => console.error(JSON.stringify(err)));
			await webhook.delete().then(() => {
				console.log('Webhook deleted!');
			}).catch(err => console.error(JSON.stringify(err)));
		}
	});
});
bot.login(token);
