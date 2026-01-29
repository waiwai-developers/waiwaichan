import "reflect-metadata";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { SUPER_CANDY_AMOUNT } from "@/src/entities/constants/Candies";
import { CandyCategoryType } from "@/src/entities/vo/CandyCategoryType";
import { CandyRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { mockReaction } from "@/tests/fixtures/discord.js/MockReaction";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import dayjs from "dayjs";
import type { MessageReactionEventDetails } from "discord.js";
import type Mocha from "mocha";
import { anything, instance, mock, verify, when } from "ts-mockito";

import { TEST_GUILD_ID, type TestContext, cleanupCandyTables, setupTestEnvironment, teardownTestEnvironment } from "./CandyHelper.test";

describe("Test Candy Add Super (Super Reaction)", () => {
	let testCommunityId: number;
	let testUserId: number;
	let testGiveUserId: number;
	let testReceiverUserId: number;

	beforeEach(async () => {
		const context: TestContext = await setupTestEnvironment();
		testCommunityId = context.communityId;
		testUserId = context.userId;
		testGiveUserId = context.giveUserId;
		testReceiverUserId = context.receiverUserId;
	});

	afterEach(async () => {
		await teardownTestEnvironment();
	});

	/**
	 * スーパーキャンディスタンプを押した時のテスト
	 * ユーザーがスーパーキャンディスタンプを押すと、スーパーキャンディが追加されることを確認する
	 * スーパーキャンディは通常のキャンディと異なり、1回のスタンプで3つのキャンディが増える
	 */
	it("should add super candy when super candy reaction is added", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const giverId = "1234";
			const receiverId = "5678";
			const creationDate = dayjs().add(1, "day").add(1, "month").startOf("day").subtract(1, "second");
			const { reaction, user, messageMock } = mockReaction(AppConfig.backend.candySuperEmoji, giverId, receiverId);
			const beforeCount = await CandyRepositoryImpl.count();

			when(messageMock.id).thenReturn("5678");
			when(messageMock.guildId).thenReturn(TEST_GUILD_ID);
			when(messageMock.url).thenReturn("https://discord.com/channels/1234567890/1234567890/5678");

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

			await new Promise((resolve) => setTimeout(resolve, 100));

			verify(messageMock.reply(anything())).never();

			const res = await CandyRepositoryImpl.findAll();
			expect(res.length).to.eq(SUPER_CANDY_AMOUNT);

			const afterCount = await CandyRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount + SUPER_CANDY_AMOUNT);

			for (const candy of res) {
				expect(String(candy.giveUserId)).to.eq(String(testUserId));
				expect(String(candy.userId)).to.eq(String(testReceiverUserId));
				expect(candy.categoryType).to.eq(CandyCategoryType.CATEGORY_TYPE_SUPER.getValue());

				const finishedDate = dayjs().add(1, "day").add(1, "month").startOf("day").add(1, "second");

				expect(creationDate.isBefore(dayjs(candy.expiredAt))).to.be.true;
				expect(finishedDate.isAfter(dayjs(candy.expiredAt))).to.be.true;
			}
		})();
	});

	/**
	 * スーパーキャンディの増加量をテスト
	 * スーパーキャンディは1回のスタンプで3つのキャンディが増えることを確認する
	 */
	it("should add three candies when super candy reaction is added", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const giverId = "1234";
			const receiverId = "5678";
			const messageId = "5678";

			await CandyRepositoryImpl.destroy({
				truncate: true,
				force: true,
			});

			const { reaction, user, messageMock } = mockReaction(AppConfig.backend.candySuperEmoji, giverId, receiverId);
			when(messageMock.id).thenReturn(messageId);
			when(messageMock.guildId).thenReturn(TEST_GUILD_ID);
			when(messageMock.url).thenReturn("https://discord.com/channels/1234567890/1234567890/5678");

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

			await new Promise((resolve) => setTimeout(resolve, 100));

			const candies = await CandyRepositoryImpl.findAll();
			expect(candies.length).to.eq(SUPER_CANDY_AMOUNT);

			for (const candy of candies) {
				expect(candy.categoryType).to.eq(CandyCategoryType.CATEGORY_TYPE_SUPER.getValue());
				expect(String(candy.giveUserId)).to.eq(String(testUserId));
				expect(String(candy.userId)).to.eq(String(testReceiverUserId));
			}
		})();
	});

	/**
	 * スーパーキャンディスタンプの月間上限をテスト
	 * 1ヶ月に付与できるスーパーキャンディの上限を超えると、エラーメッセージが表示されることを確認する
	 */
	it("should limit super candy additions per month", function (this: Mocha.Context) {
		this.timeout(20000);

		return (async () => {
			const giverId = "1234";
			const receiverId = "5678";

			await CandyRepositoryImpl.destroy({
				truncate: true,
				force: true,
			});

			const { reaction, user, messageMock } = mockReaction(AppConfig.backend.candySuperEmoji, giverId, receiverId);
			when(messageMock.id).thenReturn("1234");
			when(messageMock.guildId).thenReturn(TEST_GUILD_ID);
			when(messageMock.url).thenReturn("https://discord.com/channels/1234567890/1234567890/1234");
			when(messageMock.author).thenReturn({
				id: receiverId,
				bot: false,
			} as any);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

			await new Promise((resolve) => setTimeout(resolve, 100));

			const today = new Date();
			const candies = await CandyRepositoryImpl.findAll();
			for (const candy of candies) {
				await candy.update({
					createdAt: today,
					updatedAt: today,
				});
			}

			const { reaction: reaction2, user: user2, messageMock: messageMock2 } = mockReaction(AppConfig.backend.candySuperEmoji, giverId, receiverId);
			when(messageMock2.id).thenReturn("5678");
			when(messageMock2.guildId).thenReturn(TEST_GUILD_ID);
			when(messageMock2.url).thenReturn("https://discord.com/channels/1234567890/1234567890/5678");
			when(messageMock2.author).thenReturn({
				id: receiverId,
				bot: false,
			} as any);

			TEST_CLIENT.emit("messageReactionAdd", instance(reaction2), instance(user2), instance(mock<MessageReactionEventDetails>()));

			await new Promise((resolve) => setTimeout(resolve, 100));

			const res = await CandyRepositoryImpl.findAll();
			expect(res.length).to.eq(SUPER_CANDY_AMOUNT);
		})();
	});

	/**
	 * 同じメッセージに対する重複スーパーキャンディ付与をテスト
	 * 同じメッセージに対して複数回スーパーキャンディスタンプを押しても、1回しかカウントされないことを確認する
	 */
	it("should not add super candy for the same message multiple times", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const giverId = "1234";
			const receiverId = "5678";
			const messageId = "5678";

			await CandyRepositoryImpl.destroy({
				truncate: true,
				force: true,
			});

			const beforeCount = await CandyRepositoryImpl.count();

			const { reaction, user, messageMock } = mockReaction(AppConfig.backend.candySuperEmoji, giverId, receiverId);
			when(messageMock.id).thenReturn(messageId);
			when(messageMock.guildId).thenReturn(TEST_GUILD_ID);
			when(messageMock.url).thenReturn("https://discord.com/channels/1234567890/1234567890/5678");

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

			await new Promise((resolve) => setTimeout(resolve, 100));

			let afterCount = await CandyRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount + SUPER_CANDY_AMOUNT);

			const { reaction: reaction2, user: user2, messageMock: messageMock2 } = mockReaction(AppConfig.backend.candySuperEmoji, giverId, receiverId);
			when(messageMock2.id).thenReturn(messageId);
			when(messageMock2.guildId).thenReturn(TEST_GUILD_ID);
			when(messageMock2.url).thenReturn("https://discord.com/channels/1234567890/1234567890/5678");

			TEST_CLIENT.emit("messageReactionAdd", instance(reaction2), instance(user2), instance(mock<MessageReactionEventDetails>()));

			await new Promise((resolve) => setTimeout(resolve, 100));

			afterCount = await CandyRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount + SUPER_CANDY_AMOUNT);
		})();
	});
});
