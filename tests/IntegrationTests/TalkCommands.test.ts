import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { mockMessage, waitUntilMessageReply } from "@/tests/fixtures/discord.js/MockMessage";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import {
	type AllowedThreadTypeForTextChannel,
	Collection,
	type GuildMessageManager,
	type GuildTextThreadManager,
	type Message,
	type OmitPartialGroupDMChannel,
	type PublicThreadChannel,
	type TextChannel,
	type VoiceChannel,
} from "discord.js";
import { anything, deepEqual, instance, mock, verify, when } from "ts-mockito";

describe("Test Talk Command", () => {
	it("Test /talk title:test title", async () => {
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
		expect(createdTitle).to.eq(title);
	});

	it("Test /talk title:null", async () => {
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

	it("Test /talk channel is null", async () => {
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
		expect("expect not reach here").to.false;
	});

	it("Test /talk in not test channel", async () => {
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
		expect("expect not reach here").to.false;
	});

	it("test chat AI", async () => {
		const messageMock = mockMessage("1234", false, false);
		const channelMock = mock<PublicThreadChannel>();
		const gmmMock = mock<GuildMessageManager>();
		when(gmmMock.fetch(deepEqual({ limit: 11 }))).thenResolve(new Collection([["1", instance(mockMessage("1234", false, false))]]));
		when(channelMock.isThread()).thenReturn(true);
		when(channelMock.messages).thenReturn(instance(gmmMock));
		when(channelMock.ownerId).thenReturn(AppConfig.discord.clientId);
		when(messageMock.channel).thenReturn(instance(channelMock));

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("messageCreate", instance(messageMock) as OmitPartialGroupDMChannel<Message>);
		await waitUntilMessageReply(messageMock, 10_000);
		verify(messageMock.reply(anything())).once();
	}).timeout(10_000);
});
