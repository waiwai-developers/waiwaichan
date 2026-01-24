import "reflect-metadata";
import { ITEM_RECORDS } from "@/migrator/seeds/20241111041901-item";
import { ID_JACKPOT, PITY_COUNT } from "@/src/entities/constants/Items";
import { CandyCategoryType } from "@/src/entities/vo/CandyCategoryType";
import { CandyRepositoryImpl, UserCandyItemRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { mockSlashCommand, waitUntilReply as waitSlashUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import dayjs from "dayjs";
import type Mocha from "mocha";
import { anything, instance, verify, when } from "ts-mockito";

import {
	TEST_GUILD_ID,
	JACKPOT_RESULT_MESSAGE,
	HIT_ITEM_NAME,
	createPityCandyData,
	setupTestEnvironment,
	teardownTestEnvironment,
	type TestContext,
} from "./CandyHelper.test";

describe("Test Candy Draw Commands", () => {
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
	 * 通常のキャンディドローをテスト
	 * 十分な数のキャンディドローを行い、確率通りにアイテムが当選することを確認する
	 */
	it("should draw items with expected probabilities", function (this: Mocha.Context) {
		this.timeout(100_000);

		return (async () => {
			const commandMock = mockSlashCommand("candydraw");

			const candyAmount = 917;

			const insertData = Array.from({ length: candyAmount }, () => ({
				userId: testUserId,
				giveUserId: testGiveUserId,
				messageId: "5678",
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: null,
				communityId: testCommunityId,
				categoryType: CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue(),
			}));
			await CandyRepositoryImpl.bulkCreate(insertData);

			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			for (let i = 0; i < candyAmount + 1; i++) {
				TEST_CLIENT.emit("interactionCreate", instance(commandMock));
				if (i % 10 === 0) {
					await new Promise((resolve) => setTimeout(resolve, 100));
				}
			}

			await waitSlashUntilReply(commandMock, 10000, candyAmount);

			verify(commandMock.reply(anything())).times(candyAmount + 1);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
				expect(value).to.satisfy((text: string) => {
					return text.includes("ハズレ") || text.includes(`${ITEM_RECORDS[1].name}が当たった`) || text.includes(`${ITEM_RECORDS[0].name}が当たった`);
				});
			});
		})();
	});

	/**
	 * 天井機能付きキャンディドローをテスト
	 * 150回目のドローで必ずジャックポットが当選することを確認する
	 */
	it("should guarantee jackpot on 150th draw with pity system", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const commandMock = mockSlashCommand("candydraw");

			const insertData = createPityCandyData(150, 149, {
				userId: testUserId,
				giveUserId: testGiveUserId,
				communityId: testCommunityId,
			});
			await CandyRepositoryImpl.bulkCreate(insertData);

			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
				console.log("Reply received:", args);
			});

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			expect(value).to.include(JACKPOT_RESULT_MESSAGE);
		})();
	});

	/**
	 * 今年中にJackpotが当たっている場合、candydrawでJackpotが出ないことをテスト
	 */
	it("should not draw jackpot in candydraw when already won this year", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const thisYearStart = dayjs().startOf("year").toDate();
			await UserCandyItemRepositoryImpl.create({
				userId: testUserId,
				itemId: ID_JACKPOT,
				candyId: 1,
				expiredAt: "2999/12/31 23:59:59",
				communityId: testCommunityId,
				createdAt: thisYearStart,
				updatedAt: thisYearStart,
			});

			const commandMock = mockSlashCommand("candydraw");

			const insertData = createPityCandyData(PITY_COUNT, PITY_COUNT - 1, {
				userId: testUserId,
				giveUserId: testGiveUserId,
				communityId: testCommunityId,
			});
			await CandyRepositoryImpl.bulkCreate(insertData);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			verify(commandMock.reply(anything())).once();

			expect(value).to.not.include(JACKPOT_RESULT_MESSAGE);

			expect(value).to.satisfy((text: string) => {
				return text.includes("ハズレ") || text.includes(`${HIT_ITEM_NAME}が当たった`);
			});
		})();
	});

	/**
	 * 去年のJackpotは今年のcandydrawに影響しないことをテスト
	 */
	it("should allow jackpot in candydraw when won last year", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const lastYearEnd = dayjs().subtract(1, "year").endOf("year").toDate();
			await UserCandyItemRepositoryImpl.create({
				userId: testUserId,
				itemId: ID_JACKPOT,
				candyId: 1,
				expiredAt: "2999/12/31 23:59:59",
				communityId: testCommunityId,
				createdAt: lastYearEnd,
				updatedAt: lastYearEnd,
			});

			const commandMock = mockSlashCommand("candydraw");

			const insertData = createPityCandyData(PITY_COUNT + 6, PITY_COUNT + 5, {
				userId: testUserId,
				giveUserId: testGiveUserId,
				communityId: testCommunityId,
			});
			await CandyRepositoryImpl.bulkCreate(insertData);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			verify(commandMock.reply(anything())).once();

			expect(value).to.include(JACKPOT_RESULT_MESSAGE);
		})();
	});

	/**
	 * 今年と去年にジャックポットデータがない場合 - 通常ドローで天井以外のジャックポット
	 */
	it("should allow non-pity jackpot in candydraw when no data exists in both years", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const commandMock = mockSlashCommand("candydraw");

			const candyAmount = 50;
			const insertData = Array.from({ length: candyAmount }, () => ({
				userId: testUserId,
				giveUserId: testGiveUserId,
				messageId: "5678",
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: null,
				communityId: testCommunityId,
				categoryType: CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue(),
			}));
			await CandyRepositoryImpl.bulkCreate(insertData);

			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			verify(commandMock.reply(anything())).once();
		})();
	});

	/**
	 * 今年と去年にジャックポットデータがない場合 - 通常ドローで天井のジャックポット
	 */
	it("should guarantee pity jackpot in candydraw on 150th draw when no data exists in both years", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const commandMock = mockSlashCommand("candydraw");

			const insertData = createPityCandyData(PITY_COUNT, PITY_COUNT - 1, {
				userId: testUserId,
				giveUserId: testGiveUserId,
				communityId: testCommunityId,
			});
			await CandyRepositoryImpl.bulkCreate(insertData);

			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			expect(value).to.include(JACKPOT_RESULT_MESSAGE);
		})();
	});

	/**
	 * 去年にジャックポットデータがあり今年にデータがない場合 - 通常ドローで天井以外のジャックポット
	 */
	it("should allow non-pity jackpot in candydraw when only last year data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const lastYearEnd = dayjs().subtract(1, "year").endOf("year").toDate();
			await UserCandyItemRepositoryImpl.create({
				userId: testUserId,
				itemId: ID_JACKPOT,
				candyId: 1,
				expiredAt: "2999/12/31 23:59:59",
				communityId: testCommunityId,
				createdAt: lastYearEnd,
				updatedAt: lastYearEnd,
			});

			const commandMock = mockSlashCommand("candydraw");

			const candyAmount = 50;
			const insertData = Array.from({ length: candyAmount }, () => ({
				userId: testUserId,
				giveUserId: testGiveUserId,
				messageId: "5678",
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: null,
				communityId: testCommunityId,
				categoryType: CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue(),
			}));
			await CandyRepositoryImpl.bulkCreate(insertData);

			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			verify(commandMock.reply(anything())).once();
		})();
	});

	/**
	 * 去年にデータがなく今年にジャックポットデータがある場合 - 通常ドローで天井以外のジャックポット
	 */
	it("should not allow non-pity jackpot in candydraw when this year data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const thisYearStart = dayjs().startOf("year").toDate();
			await UserCandyItemRepositoryImpl.create({
				userId: testUserId,
				itemId: ID_JACKPOT,
				candyId: 1,
				expiredAt: "2999/12/31 23:59:59",
				communityId: testCommunityId,
				createdAt: thisYearStart,
				updatedAt: thisYearStart,
			});

			const commandMock = mockSlashCommand("candydraw");

			const candyAmount = 50;
			const insertData = Array.from({ length: candyAmount }, () => ({
				userId: testUserId,
				giveUserId: testGiveUserId,
				messageId: "5678",
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: null,
				communityId: testCommunityId,
				categoryType: CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue(),
			}));
			await CandyRepositoryImpl.bulkCreate(insertData);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			verify(commandMock.reply(anything())).once();

			expect(value).to.not.include(JACKPOT_RESULT_MESSAGE);
		})();
	});

	/**
	 * 通常ドローで天井のジャックポットが当らない
	 */
	it("should not allow pity jackpot when this year data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const thisYearStart = dayjs().startOf("year").toDate();
			await UserCandyItemRepositoryImpl.create({
				userId: testUserId,
				itemId: ID_JACKPOT,
				candyId: 1,
				expiredAt: "2999/12/31 23:59:59",
				communityId: testCommunityId,
				createdAt: thisYearStart,
				updatedAt: thisYearStart,
			});

			const commandMock = mockSlashCommand("candydraw");

			const insertData = createPityCandyData(PITY_COUNT, PITY_COUNT - 1, {
				userId: testUserId,
				giveUserId: testGiveUserId,
				communityId: testCommunityId,
			});
			await CandyRepositoryImpl.bulkCreate(insertData);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			verify(commandMock.reply(anything())).once();

			expect(value).to.not.include(JACKPOT_RESULT_MESSAGE);

			expect(value).to.satisfy((text: string) => {
				return text.includes("ハズレ") || text.includes(`${HIT_ITEM_NAME}が当たった`);
			});
		})();
	});

	/**
	 * 今年と去年にジャックポットデータがある場合 - 通常ドローで天井以外のジャックポット
	 */
	it("should not allow non-pity jackpot in candydraw when both years data exist", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const lastYearEnd = dayjs().subtract(1, "year").endOf("year").toDate();
			await UserCandyItemRepositoryImpl.create({
				userId: testUserId,
				itemId: ID_JACKPOT,
				candyId: 1,
				expiredAt: "2999/12/31 23:59:59",
				communityId: testCommunityId,
				createdAt: lastYearEnd,
				updatedAt: lastYearEnd,
			});

			const thisYearStart = dayjs().startOf("year").toDate();
			await UserCandyItemRepositoryImpl.create({
				userId: testUserId,
				itemId: ID_JACKPOT,
				candyId: 2,
				expiredAt: "2999/12/31 23:59:59",
				communityId: testCommunityId,
				createdAt: thisYearStart,
				updatedAt: thisYearStart,
			});

			const commandMock = mockSlashCommand("candydraw");

			const candyAmount = 50;
			const insertData = Array.from({ length: candyAmount }, () => ({
				userId: testUserId,
				giveUserId: testGiveUserId,
				messageId: "5678",
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: null,
				communityId: testCommunityId,
				categoryType: CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue(),
			}));
			await CandyRepositoryImpl.bulkCreate(insertData);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			verify(commandMock.reply(anything())).once();

			expect(value).to.not.include(JACKPOT_RESULT_MESSAGE);
		})();
	});

	/**
	 * 通常ドローで天井のジャックポットが当らない
	 */
	it("should not allow pity jackpot when both years data exist", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const lastYearEnd = dayjs().subtract(1, "year").endOf("year").toDate();
			await UserCandyItemRepositoryImpl.create({
				userId: testUserId,
				itemId: ID_JACKPOT,
				candyId: 1,
				expiredAt: "2999/12/31 23:59:59",
				communityId: testCommunityId,
				createdAt: lastYearEnd,
				updatedAt: lastYearEnd,
			});

			const thisYearStart = dayjs().startOf("year").toDate();
			await UserCandyItemRepositoryImpl.create({
				userId: testUserId,
				itemId: ID_JACKPOT,
				candyId: 2,
				expiredAt: "2999/12/31 23:59:59",
				communityId: testCommunityId,
				createdAt: thisYearStart,
				updatedAt: thisYearStart,
			});

			const commandMock = mockSlashCommand("candydraw");

			const insertData = createPityCandyData(PITY_COUNT, PITY_COUNT - 1, {
				userId: testUserId,
				giveUserId: testGiveUserId,
				communityId: testCommunityId,
			});
			await CandyRepositoryImpl.bulkCreate(insertData);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			verify(commandMock.reply(anything())).once();

			expect(value).to.not.include(JACKPOT_RESULT_MESSAGE);

			expect(value).to.satisfy((text: string) => {
				return text.includes("ハズレ") || text.includes(`${HIT_ITEM_NAME}が当たった`);
			});
		})();
	});
});
