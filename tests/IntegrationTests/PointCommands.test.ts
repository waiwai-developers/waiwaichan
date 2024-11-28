import { AppConfig } from "@/src/entities/config/AppConfig";
import { PointRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { mockReaction, waitUntilReply } from "@/tests/fixtures/discord.js/MockReaction";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import type { MessageReactionEventDetails } from "discord.js";
import { anything, instance, mock, verify, when } from "ts-mockito";

describe("Test Point Commands", () => {
	test("test /point adding", async () => {
		const { reaction, user, messageMock } = mockReaction(AppConfig.backend.pointEmoji, "1234", "5678");
		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

		await waitUntilReply(messageMock);

		verify(messageMock.reply(anything())).once();
		verify(messageMock.reply(`<@${instance(user).id}>さんが${AppConfig.backend.pointEmoji}スタンプを押したよ！！っ`)).once();
	});

	test("test /point adding limit", async () => {
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

	afterEach(async () => {
		await PointRepositoryImpl.destroy({
			truncate: true,
		});
	});
});
