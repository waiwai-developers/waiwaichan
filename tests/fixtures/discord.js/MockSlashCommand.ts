import { DiscordCommandRegister } from "@/src/routes/discordjs/DiscordCommandRegister";
import { ApplicationCommandOptionType } from "discord-api-types/v10";
import { type CacheType, ChatInputCommandInteraction, type CommandInteractionOptionResolver, User } from "discord.js";
import { anything, instance, mock, verify, when } from "ts-mockito";
export const mockSlashCommand = (commandName: string, options: any = {}, userId = "1234", guildId = "9999") => {
	const commandInteractionMock = mock(ChatInputCommandInteraction);
	const found = new DiscordCommandRegister().commands.find((b) => b.name === commandName);
	const optionsMock = mock<Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">>();

	found?.options.forEach((it) => {
		if (options[it.toJSON().name] == null && it.toJSON().required) {
			switch (it.toJSON().type) {
				case ApplicationCommandOptionType.Subcommand:
				case ApplicationCommandOptionType.SubcommandGroup:
					break;
				case ApplicationCommandOptionType.String:
					when(optionsMock.getString(it.toJSON().name)).thenThrow(new Error(`null is not allowed for ${it.toJSON().name}`));
					when(optionsMock.getString(it.toJSON().name, true)).thenThrow(new Error(`null is not allowed for ${it.toJSON().name}`));
					break;
				case ApplicationCommandOptionType.Integer:
					when(optionsMock.getInteger(it.toJSON().name)).thenThrow(new Error(`null is not allowed for ${it.toJSON().name}`));
					when(optionsMock.getInteger(it.toJSON().name, true)).thenThrow(new Error(`null is not allowed for ${it.toJSON().name}`));
					break;
				case ApplicationCommandOptionType.Boolean:
					when(optionsMock.getBoolean(it.toJSON().name)).thenThrow(new Error(`null is not allowed for ${it.toJSON().name}`));
					when(optionsMock.getBoolean(it.toJSON().name, true)).thenThrow(new Error(`null is not allowed for ${it.toJSON().name}`));
					break;
				case ApplicationCommandOptionType.User:
				case ApplicationCommandOptionType.Channel:
				case ApplicationCommandOptionType.Role:
				case ApplicationCommandOptionType.Mentionable:
				case ApplicationCommandOptionType.Number:
				case ApplicationCommandOptionType.Attachment:
					break;
			}
		} else {
			switch (it.toJSON().type) {
				case ApplicationCommandOptionType.Subcommand:
				case ApplicationCommandOptionType.SubcommandGroup:
					break;
				case ApplicationCommandOptionType.String:
					when(optionsMock.getString(it.toJSON().name)).thenReturn(options[it.toJSON().name]);
					when(optionsMock.getString(it.toJSON().name, true)).thenReturn(options[it.toJSON().name]);
					break;
				case ApplicationCommandOptionType.Integer:
					when(optionsMock.getInteger(it.toJSON().name)).thenReturn(options[it.toJSON().name]);
					when(optionsMock.getInteger(it.toJSON().name, true)).thenReturn(options[it.toJSON().name]);
					break;
				case ApplicationCommandOptionType.Boolean:
					when(optionsMock.getBoolean(it.toJSON().name)).thenReturn(options[it.toJSON().name]);
					when(optionsMock.getBoolean(it.toJSON().name, true)).thenReturn(options[it.toJSON().name]);
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
	when(commandInteractionMock.options).thenReturn(instance(optionsMock));
	when(commandInteractionMock.commandName).thenReturn(commandName);
	when(commandInteractionMock.isChatInputCommand()).thenReturn(true);
	when(commandInteractionMock.deferReply()).thenResolve();
	const userMock = mock(User);
	when(userMock.id).thenReturn(userId);
	when(commandInteractionMock.user).thenReturn(instance(userMock));
	when(commandInteractionMock.channelId).thenReturn("5678");
	when(commandInteractionMock.guildId).thenReturn(guildId);
	return commandInteractionMock;
};

export const waitUntilReply = async (commandInteractionMock: ChatInputCommandInteraction<CacheType>, timeout = 15000, atLeast = 1): Promise<void> => {
	const startTime = Date.now();
	return new Promise((resolve, reject) => {
		const interval = setInterval(() => {
			try {
				// Try to verify if reply was called
				verify(commandInteractionMock.reply(anything())).atLeast(atLeast);
				clearInterval(interval);
				resolve();
			} catch (replyError) {
				try {
					// If reply wasn't called, check if editReply was called
					verify(commandInteractionMock.editReply(anything())).atLeast(atLeast);
					clearInterval(interval);
					resolve();
				} catch (editReplyError) {
					// If neither was called, check if we've timed out
					if (Date.now() - startTime > timeout) {
						clearInterval(interval);
						reject(new Error("Timeout: Method was not called within the time limit."));
					}
					// Otherwise, continue waiting
				}
			}
		}, 100);
	});
};
