import "reflect-metadata";
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
	HIT_ITEM_NAME,
	createBulkCandyData,
	createPityCandyData,
	setupCommandMockReply,
	setupTestEnvironment,
	teardownTestEnvironment,
	type TestContext,
} from "./CandyHelper.test";

describe("Test Candy Draw Box Commands", () => {
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
	 * 連続キャンディドローをテスト
	 * 連続ドローで複数のアイテムが表示されることを確認する
	 */
	it("should draw multiple items in series", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const commandMock = mockSlashCommand("candyboxdraw", {});

			const insertData = createBulkCandyData(30, {
				userId: testUserId,
				giveUserId: testGiveUserId,
				communityId: testCommunityId,
			});
			await CandyRepositoryImpl.bulkCreate(insertData);

			const { getValue } = setupCommandMockReply(commandMock);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			verify(commandMock.reply(anything())).once();

			const lines = getValue().split("\n");
			const resultLines = lines.filter((line) => line.startsWith("- "));
			expect(resultLines.length).eq(10);
		})();
	});

	/**
	 * 連続ドローで必ず1つ以上のヒットがあることをテスト
	 * 連続ドローでは少なくとも1つのアイテムが当選することを確認する
	 */
	it("should guarantee at least one hit in series draw", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const commandMock = mockSlashCommand("candyboxdraw", {});

			const insertData = createBulkCandyData(10, {
				userId: testUserId,
				giveUserId: testGiveUserId,
				communityId: testCommunityId,
			});
			await CandyRepositoryImpl.bulkCreate(insertData);

			const { getValue } = setupCommandMockReply(commandMock);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			verify(commandMock.reply(anything())).once();

			const lines = getValue().split("\n");
			const resultLines = lines.filter((line) => line.startsWith("- "));
			const hitLines = resultLines.filter((line) => line.includes("当たった"));
			expect(hitLines.length).to.be.at.least(1);
		})();
	});

	/**
	 * 連続ドローでの天井機能をテスト
	 * 連続ドローでも天井機能が働き、ジャックポットが当選することを確認する
	 */
	it("should guarantee jackpot in series draw with pity system", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const commandMock = mockSlashCommand("candyboxdraw", {});

			const insertData = createPityCandyData(PITY_COUNT + 6, 146, {
				userId: testUserId,
				giveUserId: testGiveUserId,
				communityId: testCommunityId,
			});
			await CandyRepositoryImpl.bulkCreate(insertData);

			const { getValue } = setupCommandMockReply(commandMock);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			verify(commandMock.reply(anything())).once();

			const lines = getValue().split("\n");
			const resultLines = lines.filter((line) => line.startsWith("- "));

			const jackpotLines = resultLines.filter((line) => (line.includes("Tシャツ") || line.includes("waiwaiオリジナル")) && line.includes("当たった"));
			console.log("Jackpot lines:", jackpotLines);
			expect(jackpotLines.length).to.be.at.least(1);
		})();
	});

	/**
	 * キャンディ不足時の連続ドローをテスト
	 * 連続ドローに必要なキャンディが足りない場合、エラーメッセージが表示されることを確認する
	 */
	it("should display error message when not enough candies for series draw", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const commandMock = mockSlashCommand("candyboxdraw");

			const insertData = createBulkCandyData(9, {
				userId: testUserId,
				giveUserId: testGiveUserId,
				communityId: testCommunityId,
			});
			await CandyRepositoryImpl.bulkCreate(insertData);

			const { getValue } = setupCommandMockReply(commandMock);

			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock);

			verify(commandMock.reply(anything())).once();
			expect(getValue()).to.include("キャンディの数が足りないよ！っ");
		})();
	});

	/**
	 * 今年中にJackpotが当たっている場合、candyboxdrawでJackpotが出ないことをテスト
	 */
	it("should not draw jackpot in candyboxdraw when already won this year", function (this: Mocha.Context) {
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

			const commandMock = mockSlashCommand("candyboxdraw", {});

			const insertData = createPityCandyData(PITY_COUNT, 146, {
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

			const lines = value.split("\n");
			const resultLines = lines.filter((line) => line.startsWith("- "));

			const jackpotLines = resultLines.filter((line) => (line.includes("Tシャツ") || line.includes("waiwaiオリジナル")) && line.includes("当たった"));
			expect(jackpotLines.length).to.eq(0);

			resultLines.forEach((line) => {
				expect(line).to.satisfy((text: string) => {
					return text.includes("ハズレ") || text.includes(`${HIT_ITEM_NAME}が当たった`);
				});
			});
		})();
	});

	/**
	 * 今年と去年にジャックポットデータがない場合 - 連続ドローで天井以外のジャックポット
	 */
	it("should allow non-pity jackpot in candyboxdraw when no data exists in both years", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const commandMock = mockSlashCommand("candyboxdraw", {});

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
		})();
	});

	/**
	 * 連続ドローで天井のジャックポットを当てる
	 */
	it("should guarantee pity jackpot in series draw when no data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const commandMock = mockSlashCommand("candyboxdraw", {});

			const insertData = createPityCandyData(PITY_COUNT + 6, 146, {
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

			const lines = value.split("\n");
			const resultLines = lines.filter((line) => line.startsWith("- "));

			const jackpotLines = resultLines.filter((line) => (line.includes("Tシャツ") || line.includes("waiwaiオリジナル")) && line.includes("当たった"));
			expect(jackpotLines.length).to.be.at.least(1);
		})();
	});

	/**
	 * 去年にジャックポットデータがあり今年にデータがない場合 - 連続ドローで天井以外のジャックポット
	 */
	it("should allow non-pity jackpot in candyboxdraw when only last year data exists", function (this: Mocha.Context) {
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

			const commandMock = mockSlashCommand("candyboxdraw", {});

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
	 * 連続ドローで天井のジャックポットを当てる
	 */
	it("should guarantee pity jackpot in series draw when only last year data exists", function (this: Mocha.Context) {
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

			const commandMock = mockSlashCommand("candyboxdraw", {});

			const insertData = createPityCandyData(PITY_COUNT + 6, 146, {
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

			const lines = value.split("\n");
			const resultLines = lines.filter((line) => line.startsWith("- "));

			const jackpotLines = resultLines.filter((line) => (line.includes("Tシャツ") || line.includes("waiwaiオリジナル")) && line.includes("当たった"));
			expect(jackpotLines.length).to.be.at.least(1);
		})();
	});

	/**
	 * 去年にデータがなく今年にジャックポットデータがある場合 - 連続ドローで天井以外のジャックポット
	 */
	it("should not allow non-pity jackpot in candyboxdraw when this year data exists", function (this: Mocha.Context) {
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

			const commandMock = mockSlashCommand("candyboxdraw", {});

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

			const lines = value.split("\n");
			const resultLines = lines.filter((line) => line.startsWith("- "));

			const jackpotLines = resultLines.filter((line) => (line.includes("Tシャツ") || line.includes("waiwaiオリジナル")) && line.includes("当たった"));
			expect(jackpotLines.length).to.eq(0);
		})();
	});

	/**
	 * 連続ドローで天井のジャックポットが当らない
	 */
	it("should not allow pity jackpot in series draw when this year data exists", function (this: Mocha.Context) {
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

			const commandMock = mockSlashCommand("candyboxdraw", {});

			const insertData = createPityCandyData(PITY_COUNT + 6, 146, {
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

			const lines = value.split("\n");
			const resultLines = lines.filter((line) => line.startsWith("- "));

			const jackpotLines = resultLines.filter((line) => (line.includes("Tシャツ") || line.includes("waiwaiオリジナル")) && line.includes("当たった"));
			expect(jackpotLines.length).to.eq(0);

			resultLines.forEach((line) => {
				expect(line).to.satisfy((text: string) => {
					return text.includes("ハズレ") || text.includes(`${HIT_ITEM_NAME}が当たった`);
				});
			});
		})();
	});

	/**
	 * 今年と去年にジャックポットデータがある場合 - 連続ドローで天井以外のジャックポット
	 */
	it("should not allow non-pity jackpot in candyboxdraw when both years data exist", function (this: Mocha.Context) {
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

			const commandMock = mockSlashCommand("candyboxdraw", {});

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

			const lines = value.split("\n");
			const resultLines = lines.filter((line) => line.startsWith("- "));

			const jackpotLines = resultLines.filter((line) => (line.includes("Tシャツ") || line.includes("waiwaiオリジナル")) && line.includes("当たった"));
			expect(jackpotLines.length).to.eq(0);
		})();
	});

	/**
	 * 今年と去年にジャックポットデータがある場合 - 連続ドローで天井のジャックポット
	 */
	it("should not allow pity jackpot in candyboxdraw when both years data exist", function (this: Mocha.Context) {
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

			const commandMock = mockSlashCommand("candyboxdraw", {});

			const insertData = createPityCandyData(PITY_COUNT + 6, 146, {
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

			await waitSlashUntilReply(commandMock, 5000);

			verify(commandMock.reply(anything())).once();

			const lines = value.split("\n");
			const resultLines = lines.filter((line) => line.startsWith("- "));

			const jackpotLines = resultLines.filter((line) => (line.includes("Tシャツ") || line.includes("waiwaiオリジナル")) && line.includes("当たった"));
			expect(jackpotLines.length).to.eq(0);

			resultLines.forEach((line) => {
				expect(line).to.satisfy((text: string) => {
					return text.includes("ハズレ") || text.includes(`${HIT_ITEM_NAME}が当たった`);
				});
			});
		})();
	});
});
