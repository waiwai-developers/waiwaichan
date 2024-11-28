import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import type { AllowedThreadTypeForTextChannel, GuildTextThreadManager, TextChannel, VoiceChannel } from "discord.js";
import { anything, instance, mock, verify, when } from "ts-mockito";

describe("Test Talk Command", () => {
	test("Test /talk title:test title", async () => {
		const title = "test title";
		const commandMock = mockSlashCommand("talk", {
			title: title,
		});
		const channelMock = mock<TextChannel>();
		const threadManagerMock = mock<GuildTextThreadManager<AllowedThreadTypeForTextChannel>>();
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

	test("Test /talk title:null", async () => {
		const commandMock = mockSlashCommand("talk", {
			title: null,
		});
		const channelMock = mock<TextChannel>();
		const threadManagerMock = mock<GuildTextThreadManager<AllowedThreadTypeForTextChannel>>();
		when(channelMock.threads).thenReturn(instance(threadManagerMock));
		when(commandMock.channel).thenReturn(instance(channelMock));
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("")).never();
		verify(commandMock.reply(InternalErrorMessage)).once();
	});

	test("Test /talk channel is null", async () => {
		const commandMock = mockSlashCommand("talk", {
			title: "Test /talk channel is null",
		});
		const channelMock = mock<TextChannel>();
		const threadManagerMock = mock<GuildTextThreadManager<AllowedThreadTypeForTextChannel>>();
		when(channelMock.threads).thenReturn(instance(threadManagerMock));
		when(commandMock.channel).thenReturn(null);
		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		try {
			await waitUntilReply(commandMock, 500);
		} catch (_) {
			// wait until
			verify(commandMock.reply(anything())).never();
			return;
		}
		expect("expect not reach here").toBe(false);
	});

	test("Test /talk in not test channel", async () => {
		const commandMock = mockSlashCommand("talk", {
			title: "Test /talk in not test channel",
		});
		const channelMock = instance(mock<VoiceChannel>());
		when(commandMock.channel).thenReturn(channelMock);

		const TEST_CLIENT = await TestDiscordServer.getClient();

		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		try {
			await waitUntilReply(commandMock, 500);
		} catch (_) {
			// wait until
			verify(commandMock.reply(anything())).never();
			return;
		}
		// expect not reach here
		expect("expect not reach here").toBe(false);
	});
	//TODO add thread reply QA
});
