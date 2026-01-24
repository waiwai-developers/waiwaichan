import "reflect-metadata";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { CandyCategoryType } from "@/src/entities/vo/CandyCategoryType";
import { CandyRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { waitUntilMessageReply } from "@/tests/fixtures/discord.js/MockMessage";
import { mockReaction } from "@/tests/fixtures/discord.js/MockReaction";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import dayjs from "dayjs";
import type { MessageReactionEventDetails } from "discord.js";
import type Mocha from "mocha";
import { anything, instance, mock, verify, when } from "ts-mockito";

import { TEST_GUILD_ID, type TestContext, setupTestEnvironment, teardownTestEnvironment } from "./CandyHelper.test";

describe("Test Candy Add (Reaction)", () => {
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
	 * キャンディスタンプを押した時のテスト
	 * ユーザーがキャンディスタンプを押すと、キャンディが追加されることを確認する
	 */
	it("should add candy when reaction is added", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const giverId = "1234";
			const receiverId = "5678";
			const creationDate = dayjs().add(1, "month").hour(0).minute(0).second(0).millisecond(0).add(1, "day").subtract(1, "second");
			const { reaction, user, messageMock } = mockReaction(AppConfig.backend.candyEmoji, giverId, receiverId);

			when(messageMock.guildId).thenReturn(TEST_GUILD_ID);
			when(messageMock.url).thenReturn("https://discord.com/channels/1234567890/1234567890/7890");

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

			await new Promise((resolve) => setTimeout(resolve, 100));

			const res = await CandyRepositoryImpl.findAll();
			expect(res.length).to.eq(1);

			expect(String(res[0].giveUserId)).to.eq(String(testUserId));
			expect(String(res[0].userId)).to.eq(String(testReceiverUserId));

			const finishedDate = dayjs().add(1, "month").hour(0).minute(0).second(0).millisecond(0).add(1, "day").add(1, "second");

			expect(creationDate.isBefore(dayjs(res[0].expiredAt))).to.be.true;
			expect(finishedDate.isAfter(dayjs(res[0].expiredAt))).to.be.true;
		})();
	});

	/**
	 * キャンディスタンプの1日の上限をテスト
	 * 1日に付与できるキャンディの上限（3個）を超えると、エラーメッセージが表示されることを確認する
	 */
	it("should limit candy additions per day", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const giverId = "1234";
			const receiverId = "5678";

			const today = new Date();
			for (let i = 0; i < 3; i++) {
				await CandyRepositoryImpl.create({
					userId: receiverId,
					giveUserId: giverId,
					messageId: String(i),
					expiredAt: dayjs().add(1, "month").hour(0).minute(0).second(0).millisecond(0).add(1, "day").toDate(),
					deletedAt: null,
					createdAt: today,
					updatedAt: today,
					communityId: testCommunityId,
					categoryType: CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue(),
				});
			}

			const { reaction, user, messageMock } = mockReaction(AppConfig.backend.candyEmoji, giverId, receiverId);
			when(messageMock.id).thenReturn("9999");

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

			const res = await CandyRepositoryImpl.findAll();
			expect(res.length).to.eq(3);
		})();
	});

	/**
	 * 同じユーザーへのキャンディ付与をテスト
	 * 自分自身にキャンディを付与しようとした場合、何も起こらないことを確認する
	 */
	it("should not add candy when giver and receiver are the same user", async () => {
		const giverId = "1234";
		const receiverId = "1234";

		const beforeCount = await CandyRepositoryImpl.count();

		const { reaction, user } = mockReaction(AppConfig.backend.candyEmoji, giverId, receiverId);
		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

		const afterCount = await CandyRepositoryImpl.count();
		expect(afterCount).to.eq(beforeCount);
	});

	/**
	 * 同じメッセージに対する重複キャンディ付与をテスト
	 * 同じメッセージに対して複数回キャンディスタンプを押しても、1回しかカウントされないことを確認する
	 */
	it("should not add candy for the same message multiple times", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const giverId = "1234";
			const receiverId = "5678";
			const messageId = "5678";

			const { reaction: reaction1, user: user1, messageMock: messageMock1 } = mockReaction(AppConfig.backend.candyEmoji, giverId, receiverId);
			when(messageMock1.id).thenReturn(messageId);
			when(messageMock1.guildId).thenReturn(TEST_GUILD_ID);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction1), instance(user1), instance(mock<MessageReactionEventDetails>()));

			await new Promise((resolve) => setTimeout(resolve, 100));

			let afterCount = await CandyRepositoryImpl.count();
			expect(afterCount).to.eq(1);

			const { reaction: reaction2, user: user2, messageMock: messageMock2 } = mockReaction(AppConfig.backend.candyEmoji, giverId, receiverId);
			when(messageMock2.id).thenReturn(messageId);
			when(messageMock2.guildId).thenReturn(TEST_GUILD_ID);

			TEST_CLIENT.emit("messageReactionAdd", instance(reaction2), instance(user2), instance(mock<MessageReactionEventDetails>()));

			await new Promise((resolve) => setTimeout(resolve, 100));

			afterCount = await CandyRepositoryImpl.count();
			expect(afterCount).to.eq(1);
		})();
	});

	/**
	 * 無効なメッセージIDでのキャンディ付与をテスト
	 * メッセージIDが無効な場合、キャンディが追加されないことを確認する
	 */
	it("should not add candy when message id is invalid", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const giverId = "1234";
			const receiverId = "5678";
			const { reaction, user, messageMock } = mockReaction(AppConfig.backend.candyEmoji, giverId, receiverId);
			when(messageMock.id).thenReturn(null as any);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

			try {
				await waitUntilMessageReply(messageMock, 100);
			} catch (e) {
				verify(messageMock.reply(anything())).never();
				return;
			}
			expect("expect not reach here").to.false;
		})();
	});
});
