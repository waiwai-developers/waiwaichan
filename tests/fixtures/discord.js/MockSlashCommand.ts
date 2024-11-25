import { DiscordCommandRegister } from "@/src/routes/discordjs/DiscordCommandRegister";
import { ApplicationCommandOptionType } from "discord-api-types/v10";
import {
	ApplicationCommandOption,
	type CacheType,
	ChatInputCommandInteraction,
	type CommandInteractionOptionResolver,
} from "discord.js";
import { anything, mock, verify, when } from "ts-mockito";
const commandInteractionMock = mock(ChatInputCommandInteraction);
export const mockSlashCommand = (commandName: string, options: any = {}) => {
	const found = new DiscordCommandRegister().commands.find(
		(b) => b.name === commandName,
	);
	const optionsMock =
		mock<
			Omit<
				CommandInteractionOptionResolver<CacheType>,
				"getMessage" | "getFocused"
			>
		>();
	found?.options.forEach((it) => {
		if (options[it.toJSON().name] != null) {
			switch (it.toJSON().type) {
				case ApplicationCommandOptionType.Subcommand:
				case ApplicationCommandOptionType.SubcommandGroup:
					break;
				case ApplicationCommandOptionType.String:
					when(optionsMock.getString(it.toJSON().name)).thenReturn(
						options[it.toJSON().name],
					);
					break;
				case ApplicationCommandOptionType.Integer:
					when(optionsMock.getInteger(it.toJSON().name)).thenReturn(
						options[it.toJSON().name],
					);
					break;
				case ApplicationCommandOptionType.Boolean:
					when(optionsMock.getBoolean(it.toJSON().name)).thenReturn(
						options[it.toJSON().name],
					);
					break;
				case ApplicationCommandOptionType.User:
				case ApplicationCommandOptionType.Channel:
				case ApplicationCommandOptionType.Role:
				case ApplicationCommandOptionType.Mentionable:
				case ApplicationCommandOptionType.Number:
				case ApplicationCommandOptionType.Attachment:
					break;
			}
		}
	});
	when(commandInteractionMock.options).thenReturn(optionsMock);
	when(commandInteractionMock.commandName).thenReturn(commandName);
	when(commandInteractionMock.isChatInputCommand()).thenReturn(true);
	when(commandInteractionMock.deferReply()).thenResolve();
	return commandInteractionMock;
};

export const waitUntilReply = async (): Promise<void> => {
	const startTime = Date.now();
	return new Promise((resolve, reject) => {
		const interval = setInterval(async () => {
			await new Promise(() => {
				verify(commandInteractionMock.reply(anything())).atLeast(1);
				clearInterval(interval);
				resolve();
			})
				.catch((e) => {
					verify(commandInteractionMock.editReply(anything())).atLeast(1);
					clearInterval(interval);
					resolve(e);
				})
				.catch((e) => {
					if (Date.now() - startTime > 15000) {
						clearInterval(interval);
						reject(
							new Error(
								"Timeout: Method was not called within the time limit.",
							),
						);
					}
				});
		}, 100);
	});
};
