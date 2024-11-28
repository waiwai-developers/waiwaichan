import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { PointRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { mockReaction, waitUntilReply } from "@/tests/fixtures/discord.js/MockReaction";
import { mockSlashCommand, waitUntilReply as waitSlashUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import dayjs from "dayjs";
import type { MessageReactionEventDetails } from "discord.js";
import { anything, instance, mock, verify, when } from "ts-mockito";

describe("Test Point Commands", () => {
	test("test point give adding", async () => {
		const giverId = "1234";
		const receiverId = "5678";
		const creationDate = dayjs().add(1, "month").subtract(1, "second");
		const { reaction, user, messageMock } = mockReaction(AppConfig.backend.pointEmoji, giverId, receiverId);
		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

		await waitUntilReply(messageMock);

		verify(messageMock.reply(anything())).once();
		verify(messageMock.reply(`<@${instance(user).id}>さんが${AppConfig.backend.pointEmoji}スタンプを押したよ！！っ`)).once();

		new MysqlConnector();
		const res = await PointRepositoryImpl.findAll();
		expect(res.length).toEqual(1);

		expect(String(res[0].giveUserId)).toBe(giverId);
		expect(String(res[0].receiveUserId)).toBe(receiverId);

		const finishedDate = dayjs().add(1, "month").add(1, "second");

		expect(creationDate.isBefore(dayjs(res[0].expiredAt))).toBe(true);
		expect(finishedDate.isAfter(dayjs(res[0].expiredAt))).toBe(true);
	});

	test("test point give adding limit", async () => {
		const reaction = mockReaction(AppConfig.backend.pointEmoji, "1234", "5678");
		const TEST_CLIENT = await TestDiscordServer.getClient();
		for (let i = 0; i < 4; i++) {
			when(reaction.messageMock.id).thenReturn(String(i));
			when(reaction.reaction.message).thenReturn(instance(reaction.messageMock));
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction.reaction), instance(reaction.user), instance(mock<MessageReactionEventDetails>()));
		}

		await waitUntilReply(reaction.messageMock, 15_000, 4);

		verify(reaction.messageMock.reply(anything())).times(4);
		verify(reaction.messageMock.reply(`<@${instance(reaction.user).id}>さんが${AppConfig.backend.pointEmoji}スタンプを押したよ！！っ`)).times(3);
		verify(reaction.messageMock.reply("今はスタンプを押してもポイントをあげられないよ！っ")).times(1);

		new MysqlConnector();
		const res = await PointRepositoryImpl.findAll();
		expect(res.length).toEqual(3);
	});

	test("test point give not add same user", async () => {
		const giverId = "1234";
		const receiverId = "1234";

		const { reaction, user, messageMock } = mockReaction(AppConfig.backend.pointEmoji, giverId, receiverId);
		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

		try {
			await waitUntilReply(messageMock, 300);
		} catch (e) {
			verify(messageMock.reply(anything())).never();
			return;
		}
		expect("expect not reach here").toBe(false);
	});

	test("test point give not adding for same message", async () => {
		const giverId = "1234";
		const receiverId = "5678";
		const { reaction, user, messageMock } = mockReaction(AppConfig.backend.pointEmoji, giverId, receiverId);

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));
		TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

		await new Promise((resolve) => setTimeout(resolve, 1000));

		verify(messageMock.reply(anything())).once();
		verify(messageMock.reply(`<@${instance(user).id}>さんが${AppConfig.backend.pointEmoji}スタンプを押したよ！！っ`)).once();
	});

	test("test /pointcheck when no points", async () => {
		const commandMock = mockSlashCommand("pointcheck");

		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));
		await waitSlashUntilReply(commandMock);
		verify(commandMock.reply(anything())).once();
		verify(commandMock.reply("ポイントがないよ！っ")).once();
	});

	afterEach(async () => {
		await PointRepositoryImpl.destroy({
			truncate: true,
		});
	});
});
