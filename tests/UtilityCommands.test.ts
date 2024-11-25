import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import {
	mockSlashCommand,
	waitUntilReply,
} from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { anything, instance, verify, when } from "ts-mockito";

describe("Test UtilityCommand", () => {
	test("Test /help category:all", async () => {
		const commandMock = mockSlashCommand("help", {
			category: "all",
		});
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("")).never();
		verify(commandMock.reply(InternalErrorMessage)).never();
	});
	test("Test /help category:mainコマンド", async () => {
		const commandMock = mockSlashCommand("help", {
			category: "mainコマンド",
		});
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("")).never();
		verify(commandMock.reply(InternalErrorMessage)).never();
	});
});
