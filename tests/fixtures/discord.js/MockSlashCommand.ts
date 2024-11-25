import { DiscordCommandRegister } from "@/src/routes/discordjs/DiscordCommandRegister";
import { ChatInputCommandInteraction } from "discord.js";
import { anything, mock, verify, when } from "ts-mockito";
const commandInteractionMock = mock(ChatInputCommandInteraction);
export const mockSlashCommand = (commandName: string) => {
	const found = new DiscordCommandRegister().commands.find(
		(b) => b.name === commandName,
	);
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
