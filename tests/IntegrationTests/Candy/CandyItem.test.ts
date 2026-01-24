import "reflect-metadata";
import { ITEM_RECORDS } from "@/migrator/seeds/20241111041901-item";
import { ID_HIT, ID_JACKPOT } from "@/src/entities/constants/Items";
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

describe("Test Candy Item Commands", () => {
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
	 * アイテムIDからアイテム情報を取得するヘルパー関数
	 */
	const getItem = (id: number) => {
		return ITEM_RECORDS[id - 1];
	};

	/**
	 * /candyitemコマンドのテスト
	 * 所持しているアイテムが正しく表示されることを確認する
	 */
	it("should display owned items with /candyitem command", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const commandMock = mockSlashCommand("candyitem");

			const insertData = [
				{
					userId: testUserId,
					itemId: ID_HIT,
					candyId: 1,
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: null,
					communityId: testCommunityId,
				},
				{
					userId: testUserId,
					itemId: ID_HIT,
					candyId: 2,
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: null,
					communityId: testCommunityId,
				},
				{
					userId: testUserId,
					itemId: ID_JACKPOT,
					candyId: 3,
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: "1970/01/01 00:00:00",
					communityId: testCommunityId,
				},
				{
					userId: testUserId,
					itemId: ID_JACKPOT,
					candyId: 4,
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: "1970/01/01 00:00:00",
					communityId: testCommunityId,
				},
				{
					userId: testUserId,
					itemId: ID_JACKPOT,
					candyId: 5,
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: null,
					communityId: testCommunityId,
				},
			];
			const inserted = await UserCandyItemRepositoryImpl.bulkCreate(insertData);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock);

			verify(commandMock.reply(anything())).once();
			expect(value).to.include("以下のアイテムが交換できるよ！っ");

			expect(value).to.include(`${getItem(inserted[0].itemId).name}`);
			expect(value).to.include(`${getItem(inserted[1].itemId).name}`);
			expect(value).to.include(`${getItem(inserted[4].itemId).name}`);
			expect(value).to.include(`説明：${getItem(inserted[0].itemId).description}`);
		})();
	});

	/**
	 * アイテムがない場合の/candyitemコマンドをテスト
	 * アイテムを所持していない場合、適切なメッセージが表示されることを確認する
	 */
	it("should display message when no items exist", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const commandMock = mockSlashCommand("candyitem");

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
