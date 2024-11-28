import { AppConfig } from "@/src/entities/config/AppConfig";
import { PointRepositoryImpl } from "@/src/repositories/sequelize-mysql";
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

	afterEach(async () => {
		await PointRepositoryImpl.destroy({
			truncate: true,
		});
	});
});
