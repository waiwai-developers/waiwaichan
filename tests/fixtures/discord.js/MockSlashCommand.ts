import { DiscordCommandRegister } from "@/src/routes/discordjs/DiscordCommandRegister";
import { ApplicationCommandOptionType } from "discord-api-types/v10";
import { type CacheType, ChatInputCommandInteraction, type CommandInteractionOptionResolver, type Message, TextChannel, type ThreadChannel, User } from "discord.js";
import { anything, instance, mock, verify, when } from "ts-mockito";

export type MockSlashCommandOptions = {
	userId?: string;
	guildId?: string;
	withChannel?: boolean;
	replyMessage?: Message<boolean>;
};

export const mockSlashCommand = (commandName: string, options: any = {}, userIdOrOptions: string | MockSlashCommandOptions = "1234", guildId = "9999") => {
	// Handle both old and new API
	let userId: string;
	let withChannel: boolean;
	let replyMessage: Message<boolean> | undefined;
	
	if (typeof userIdOrOptions === "string") {
		userId = userIdOrOptions;
		withChannel = false;
		replyMessage = undefined;
	} else {
		userId = userIdOrOptions.userId ?? "1234";
		guildId = userIdOrOptions.guildId ?? "9999";
		withChannel = userIdOrOptions.withChannel ?? false;
		replyMessage = userIdOrOptions.replyMessage;
	}
	
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
	
	// Setup channel mock if requested
	if (withChannel) {
		const channelMock = mock(TextChannel);
		const threadMock = mock<ThreadChannel>();
		when(threadMock.id).thenReturn("thread-123");
		when(channelMock.threads).thenReturn({
			create: async () => instance(threadMock),
		} as any);
		const mockedChannel = instance(channelMock);
		Object.setPrototypeOf(mockedChannel, TextChannel.prototype);
		when(commandInteractionMock.channel).thenReturn(mockedChannel);
	} else {
		when(commandInteractionMock.channel).thenReturn(null);
	}
	
	return commandInteractionMock;
};

export const createMockMessage = (guildId = "9999", messageId = "msg-123") => {
	const messageMock = mock<Message<boolean>>();
	when(messageMock.guildId).thenReturn(guildId);
	when(messageMock.id).thenReturn(messageId);
	
	const threadMock = mock<ThreadChannel>();
	when(threadMock.id).thenReturn("thread-123");
	when(messageMock.startThread(anything())).thenResolve(instance(threadMock) as any);
	
	return { messageMock, message: instance(messageMock), threadMock };
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
