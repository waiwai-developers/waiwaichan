const { Client, GatewayIntentBits } = require("discord.js");
const { token } = require("../../config.json");
const loadModule = require("../..//logics/index.js");
// TODO replace to ESM
loadModule().then(({ help, waiwai, parrot, dice, choice, translate, reminderSet, reminderDelete, reminderList }) => {
	const client = new Client({ intents: [GatewayIntentBits.Guilds] });

	client.on("interactionCreate", async (interaction) => {
		try {
			if (!interaction.isCommand()) return;

			const command = interaction.commandName;
			const message = interaction.options?.getString("message") ?? null;
			const parameters = message?.split(" ") ?? null;
			let parameter = null;
			switch (command) {
				case "help": {
					await interaction.reply(help());
					break;
				}
				case "waiwai":
					await interaction.reply(waiwai());
					break;
				case "parrot":
					parameter = parameters[0];

					if (parameter == null) {
						await interaction.reply("パラメーターがないよ！っ");
						return;
					}

					await interaction.reply(parrot(parameter));
					break;
				case "dice":
					parameter = parameters[0];

					if (parameter == null) {
						await interaction.reply("パラメーターがないよ！っ");
						return;
					}
					if (!Number.isInteger(Number(parameter))) {
						await interaction.reply("パラメーターが整数じゃないよ！っ");
						return;
					}
					if (Number(parameter) <= 0) {
						await interaction.reply("パラメーターが0以下の数だよ！っ");
						return;
					}

					await interaction.reply(dice(parameter));
					break;
				case "choice":
					if (parameters == []) {
						await interaction.reply("パラメーターがないよ！っ");
						return;
					}

					await interaction.reply(choice(parameters));
					break;
				case "translate": {
					const source = interaction.options?.getString("source");
					const target = interaction.options?.getString("target");

					if (message == null) {
						await interaction.reply("messageパラメーターがないよ！っ");
						return;
					}
					if (source == null) {
						await interaction.reply("sourceパラメーターがないよ！っ");
						return;
					}
					if (target == null) {
						await interaction.reply("targetパラメーターがないよ！っ");
						return;
					}
					if (source === target) {
						await interaction.reply("sourceとtargetが同じだよ！っ");
						return;
					}

					const texts = message.split("  ");
					await interaction.deferReply();
					const postMessages = await translate(texts, source, target);

					if (postMessages == []) {
						await interaction.reply("翻訳できなかったよ！っ");
						return;
					}

					await interaction.editReply(postMessages.join("\n\n"));
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
					await interaction.reply( await reminderSet(interaction.channelId, interaction.user.id, interaction.options.getString("message"), interaction.options.getString("datetime")));
					break;
				case "reminderdelete":
					await interaction.reply( await reminderDelete(interaction.options.getString("id"), interaction.user.id));
					break;
				case "reminderlist":
					await interaction.reply( await reminderList(interaction.user.id));
					break;
				default:
					await interaction.reply("そんなコマンドはないよ！っ");
			}
		} catch (e) {
			console.error("Error:", e);
			await interaction.reply("エラーが起こったよ！っ");
		}
	});

	client.login(token);
});
