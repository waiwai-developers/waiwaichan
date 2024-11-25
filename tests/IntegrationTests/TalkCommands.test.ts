import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import {
	mockSlashCommand,
	waitUntilReply,
} from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import type {
	AllowedThreadTypeForTextChannel,
	GuildTextThreadManager,
	TextChannel,
} from "discord.js";
import { anything, instance, mock, verify, when } from "ts-mockito";

describe("Test Talk Command", () => {
	test("Test /talk title:test title", async () => {
		const title = "test title";
		const commandMock = mockSlashCommand("talk", {
			title: title,
		});
		const channelMock = mock<TextChannel>();
		const threadManagerMock =
			mock<GuildTextThreadManager<AllowedThreadTypeForTextChannel>>();
		let createdTitle = "";
		when(threadManagerMock.create(anything())).thenCall((args) => {
			createdTitle = args.name;
		});
		when(channelMock.threads).thenReturn(instance(threadManagerMock));
		when(commandMock.channel).thenReturn(instance(channelMock));
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("")).never();
		verify(commandMock.reply("以下にお話する場を用意したよ！っ")).once();
		verify(threadManagerMock.create(anything())).once();
		expect(createdTitle).toEqual(title);
	});
});
