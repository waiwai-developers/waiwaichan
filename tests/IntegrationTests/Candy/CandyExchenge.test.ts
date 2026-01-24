import "reflect-metadata";
import { ID_HIT } from "@/src/entities/constants/Items";
import { UserCandyItemRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { mockSlashCommand, waitUntilReply as waitSlashUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import type Mocha from "mocha";
import { anything, instance, verify, when } from "ts-mockito";

import {
	TEST_GUILD_ID,
	setupTestEnvironment,
	teardownTestEnvironment,
	type TestContext,
} from "./CandyHelper.test";

describe("Test Candy Exchange Commands", () => {
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
	 * /candyexchangeコマンドのテスト
	 * アイテムを正常に交換できることを確認する
	 */
	it("should exchange items successfully with /candyexchange command", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const commandMock = mockSlashCommand("candyexchange", {
				type: ID_HIT,
				amount: 1,
			});

			await UserCandyItemRepositoryImpl.create({
				userId: testUserId,
				itemId: ID_HIT,
				candyId: 1,
				expiredAt: "2999/12/31 23:59:59",
				communityId: testCommunityId,
			});

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
				console.log("Reply called with:", args);
			});

			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			try {
				await waitSlashUntilReply(commandMock);

				verify(commandMock.reply(anything())).atLeast(1);
				expect(value).to.include("交換");
			} catch (error) {
				console.error("Test failed:", error);
				throw error;
			}
		})();
	});

	/**
	 * アイテムがない場合の/candyexchangeコマンドをテスト
	 * アイテムを所持していない場合、エラーメッセージが表示されることを確認する
	 */
	it("should display error message when no items exist for exchange", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const commandMock = mockSlashCommand("candyexchange", {
				type: 0,
				amount: 1,
			});

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock);

			verify(commandMock.reply(anything())).once();
			expect(value).to.eq("アイテムは持ってないよ！っ");
		})();
	});

	/**
	 * 無効なアイテムIDでの/candyexchangeコマンドをテスト
	 * 存在しないアイテムIDを指定した場合、エラーメッセージが表示されることを確認する
	 */
	it("should display error message when exchanging with invalid item id", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const commandMock = mockSlashCommand("candyexchange", {
				type: 9999,
				amount: 1,
			});

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock);

			verify(commandMock.reply(anything())).once();
			expect(value).to.eq("アイテムは持ってないよ！っ");
		})();
	});

	/**
	 * 所持数以上のアイテム交換をテスト
	 * 所持数以上のアイテムを交換しようとした場合、エラーメッセージが表示されることを確認する
	 */
	it("should display error message when exchanging too many items", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const commandMock = mockSlashCommand("candyexchange", {
				type: ID_HIT,
				amount: 10,
			});

			const itemId = ID_HIT;
			await UserCandyItemRepositoryImpl.create({
				userId: testUserId,
				itemId: itemId,
				candyId: 1,
				expiredAt: "2999/12/31 23:59:59",
				communityId: testCommunityId,
			});

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock);

			verify(commandMock.reply(anything())).once();
			expect(value).to.eq("アイテムは持ってないよ！っ");
		})();
	});
});
