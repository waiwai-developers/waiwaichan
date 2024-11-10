import { Client, GatewayIntentBits } from "discord.js";
import config from "../../config.json" with { type: "json" };
import {
	choice,
	dice,
	help,
	parrot,
	pointCheck,
	pointDraw,
	pointItem,
	reminderDelete,
	reminderList,
	reminderSet,
	translate,
	waiwai,
} from "../../logics/index.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on("interactionCreate", async (interaction) => {
	try {
		if (!interaction.isCommand()) return;

		// const message = interaction.options?.getString("message") ?? null;
		// const parameters = message?.split(" ") ?? null;
		// let parameter = null;
		switch (interaction.commandName) {
			case "help":
				await interaction.reply(help());
				break;
			case "waiwai":
				await interaction.reply(waiwai());
				break;
			case "parrot":
				await interaction.reply(
					parrot(interaction.options?.getString("message")),
				);
				break;
			case "dice":
				await interaction.reply(
					dice(interaction.options?.getString("parameter")),
				);
				break;
			case "choice":
				await interaction.reply(
					choice(interaction.options?.getString("items")),
				);
				break;
			case "translate": {
				await interaction.deferReply();
				await interaction.editReply(
					await translate(
						interaction.options?.getString("messages"),
						interaction.options?.getString("source"),
						interaction.options?.getString("target"),
					),
				);
				break;
			}
			case "talk": {
				const title = interaction.options?.getString("title");
				if (title == null) {
					await interaction.reply("titleパラメーターがないよ！っ");
					return;
				}

				await interaction.reply("以下にお話する場を用意したよ！っ");
				await interaction.channel.threads.create({
					name: title,
					autoArchiveDuration: 60,
				});
				break;
			}
			case "reminderset":
				await interaction.reply(
					await reminderSet(
						interaction.channelId,
						interaction.user.id,
						interaction.options.getString("message"),
						interaction.options.getString("datetime"),
					),
				);
				break;
			case "reminderdelete":
				await interaction.reply(
					await reminderDelete(
						interaction.options.getString("id"),
						interaction.user.id,
					),
				);
				break;
			case "reminderlist":
				await interaction.reply(await reminderList(interaction.user.id));
				break;
			case "pointcheck":
				await interaction.reply(await pointCheck(interaction.user.id));
				break;
			case "pointdraw":
				await interaction.reply(await pointDraw(interaction.user.id));
				break;
			case "pointitem":
				await interaction.reply(await pointItem(interaction.user.id));
				break;
			default:
				await interaction.reply("そんなコマンドはないよ！っ");
		}
	} catch (e) {
		console.error("Error:", e);
		await interaction.reply("エラーが起こったよ！っ");
	}
});

client.login(config.token);
