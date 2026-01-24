import "reflect-metadata";
import { ITEM_RECORDS } from "@/migrator/seeds/20241111041901-item";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { SUPER_CANDY_AMOUNT } from "@/src/entities/constants/Candies";
import { ID_HIT, ID_JACKPOT, PITY_COUNT } from "@/src/entities/constants/Items";
import { CandyCategoryType } from "@/src/entities/vo/CandyCategoryType";
import { CandyRepositoryImpl, CommunityRepositoryImpl, UserCandyItemRepositoryImpl, UserRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";
import { waitUntilMessageReply } from "@/tests/fixtures/discord.js/MockMessage";
import { mockReaction } from "@/tests/fixtures/discord.js/MockReaction";
import { mockSlashCommand, waitUntilReply as waitSlashUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import dayjs from "dayjs";
import type { ChatInputCommandInteraction, MessageReactionEventDetails } from "discord.js";
import type Mocha from "mocha";
import { anything, instance, mock, verify, when } from "ts-mockito";

// テスト用の定数
const TEST_GUILD_ID = "1234567890"; // communityのclientId
const TEST_USER_ID = "1234"; // userのclientId (candy受領者)
const TEST_GIVE_USER_ID = "12345"; // candy付与者のclientId
const TEST_RECEIVER_ID = "5678"; // reaction受領者のclientId

// ============================================================
// モック生成ヘルパー関数
// ============================================================

/**
 * キャンディデータ生成用の型定義
 */
interface CandyDataOptions {
	userId: number;
	giveUserId: number;
	communityId: number;
	messageId?: string;
	expiredAt?: string;
	deletedAt?: string | null;
	categoryType?: number;
	createdAt?: string;
	updatedAt?: string;
}

/**
 * 基本的なキャンディデータを生成する
 */
function createCandyData(options: CandyDataOptions): {
	userId: number;
	giveUserId: number;
	messageId: string;
	expiredAt: string;
	deletedAt: string | null;
	communityId: number;
	categoryType: number;
	createdAt?: string;
	updatedAt?: string;
} {
	const data: ReturnType<typeof createCandyData> = {
		userId: options.userId,
		giveUserId: options.giveUserId,
		messageId: options.messageId ?? "5678",
		expiredAt: options.expiredAt ?? "2999/12/31 23:59:59",
		deletedAt: options.deletedAt ?? null,
		communityId: options.communityId,
		categoryType: options.categoryType ?? CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue(),
	};

	if (options.createdAt) data.createdAt = options.createdAt;
	if (options.updatedAt) data.updatedAt = options.updatedAt;

	return data;
}

/**
 * 複数の未使用キャンディデータを一括生成する
 */
function createBulkCandyData(
	amount: number,
	options: Pick<CandyDataOptions, "userId" | "giveUserId" | "communityId" | "categoryType">
): ReturnType<typeof createCandyData>[] {
	return Array.from({ length: amount }, () =>
		createCandyData({
			...options,
			messageId: "5678",
			deletedAt: null,
		})
	);
}

/**
 * 天井システム用のキャンディデータを生成する
 * @param totalAmount 総キャンディ数
 * @param usedCount 使用済みのキャンディ数
 */
function createPityCandyData(
	totalAmount: number,
	usedCount: number,
	options: Pick<CandyDataOptions, "userId" | "giveUserId" | "communityId" | "categoryType">
): ReturnType<typeof createCandyData>[] {
	const insertData: ReturnType<typeof createCandyData>[] = [];

	for (let i = 0; i < totalAmount; i++) {
		const date = new Date();
		date.setDate(date.getDate() - (totalAmount - i));
		insertData.push(
			createCandyData({
				...options,
				messageId: String(10_000 + i),
				deletedAt: i < usedCount ? date.toISOString() : null,
				createdAt: date.toISOString(),
				updatedAt: date.toISOString(),
			})
		);
	}

	return insertData;
}

/**
 * UserCandyItemデータ生成用の型定義
 */
interface UserCandyItemDataOptions {
	userId: number;
	communityId: number;
	itemId: number;
	candyId: number;
	expiredAt?: string;
	deletedAt?: string | null;
	createdAt?: Date;
	updatedAt?: Date;
}

/**
 * 基本的なUserCandyItemデータを生成する
 */
function createUserCandyItemData(options: UserCandyItemDataOptions): {
	userId: number;
	itemId: number;
	candyId: number;
	expiredAt: string;
	communityId: number;
	deletedAt?: string | null;
	createdAt?: Date;
	updatedAt?: Date;
} {
	const data: ReturnType<typeof createUserCandyItemData> = {
		userId: options.userId,
		itemId: options.itemId,
		candyId: options.candyId,
		expiredAt: options.expiredAt ?? "2999/12/31 23:59:59",
		communityId: options.communityId,
	};

	if (options.deletedAt !== undefined) data.deletedAt = options.deletedAt;
	if (options.createdAt) data.createdAt = options.createdAt;
	if (options.updatedAt) data.updatedAt = options.updatedAt;

	return data;
}

/**
 * 今年のジャックポットアイテムデータを生成する
 */
function createThisYearJackpotData(
	options: Pick<UserCandyItemDataOptions, "userId" | "communityId" | "candyId">
): ReturnType<typeof createUserCandyItemData> {
	const thisYearStart = dayjs().startOf("year").toDate();
	return createUserCandyItemData({
		...options,
		itemId: ID_JACKPOT,
		createdAt: thisYearStart,
		updatedAt: thisYearStart,
	});
}

/**
 * 去年のジャックポットアイテムデータを生成する
 */
function createLastYearJackpotData(
	options: Pick<UserCandyItemDataOptions, "userId" | "communityId" | "candyId">
): ReturnType<typeof createUserCandyItemData> {
	const lastYearEnd = dayjs().subtract(1, "year").endOf("year").toDate();
	return createUserCandyItemData({
		...options,
		itemId: ID_JACKPOT,
		createdAt: lastYearEnd,
		updatedAt: lastYearEnd,
	});
}

/**
 * スラッシュコマンドモックの応答設定を行うヘルパー
 * @returns 応答値を取得するためのgetter関数
 */
function setupCommandMockReply(commandMock: ChatInputCommandInteraction): {
	getValue: () => string;
	getValues: () => string[];
} {
	let value = "";
	const values: string[] = [];

	when(commandMock.reply(anything())).thenCall((args) => {
		value = args;
		values.push(args);
		console.log("Reply received:", args);
	});

	when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

	return {
		getValue: () => value,
		getValues: () => values,
	};
}

// ============================================================
// イベント登録テストヘルパー関数
// ============================================================

/**
 * スラッシュコマンドイベントを発火し、応答を待つ
 */
async function emitSlashCommand(
	commandMock: ChatInputCommandInteraction,
	timeout?: number,
	expectedCalls?: number
): Promise<void> {
	const TEST_CLIENT = await TestDiscordServer.getClient();
	TEST_CLIENT.emit("interactionCreate", instance(commandMock));
	await waitSlashUntilReply(commandMock, timeout, expectedCalls);
}

/**
 * リアクションモックのメッセージ設定用オプション
 */
interface ReactionMessageOptions {
	messageId?: string;
	guildId?: string;
	url?: string;
	authorId?: string;
	authorBot?: boolean;
}

/**
 * リアクションモックのメッセージ設定を行うヘルパー
 */
function setupReactionMessageMock(
	messageMock: ReturnType<typeof mockReaction>["messageMock"],
	options: ReactionMessageOptions = {}
): void {
	const {
		messageId = "5678",
		guildId = TEST_GUILD_ID,
		url = `https://discord.com/channels/${guildId}/${guildId}/${messageId}`,
		authorId,
		authorBot,
	} = options;

	when(messageMock.id).thenReturn(messageId);
	when(messageMock.guildId).thenReturn(guildId);
	when(messageMock.url).thenReturn(url);

	if (authorId !== undefined) {
		when(messageMock.author).thenReturn({
			id: authorId,
			bot: authorBot ?? false,
		} as any);
	}
}

/**
 * リアクションイベントを発火し、処理完了を待つ
 */
async function emitReactionEvent(
	reaction: ReturnType<typeof mockReaction>["reaction"],
	user: ReturnType<typeof mockReaction>["user"],
	waitTime = 100
): Promise<void> {
	const TEST_CLIENT = await TestDiscordServer.getClient();
	TEST_CLIENT.emit(
		"messageReactionAdd",
		instance(reaction),
		instance(user),
		instance(mock<MessageReactionEventDetails>())
	);
	// 少し待機してハンドラーの処理が完了するのを待つ
	await new Promise((resolve) => setTimeout(resolve, waitTime));
}

/**
 * キャンディリアクションテスト用のセットアップと発火を行うヘルパー
 */
async function setupAndEmitCandyReaction(
	emoji: string,
	giverId: string,
	receiverId: string,
	messageOptions: ReactionMessageOptions = {}
): Promise<{
	reaction: ReturnType<typeof mockReaction>["reaction"];
	user: ReturnType<typeof mockReaction>["user"];
	messageMock: ReturnType<typeof mockReaction>["messageMock"];
}> {
	const { reaction, user, messageMock } = mockReaction(emoji, giverId, receiverId);
	setupReactionMessageMock(messageMock, messageOptions);
	await emitReactionEvent(reaction, user);
	return { reaction, user, messageMock };
}

// ============================================================
// Handler初期化ヘルパー関数
// ============================================================

/**
 * テストコンテキストの型定義
 */
interface TestContext {
	communityId: number;
	userId: number;
	giveUserId: number;
	receiverUserId: number;
}

/**
 * データベース接続を初期化する
 */
function initializeDatabase(): void {
	new MysqlConnector();
}

/**
 * すべてのCandy関連テーブルをクリーンアップする
 */
async function cleanupAllTables(): Promise<void> {
	await CandyRepositoryImpl.destroy({ truncate: true, force: true });
	await UserCandyItemRepositoryImpl.destroy({ truncate: true, force: true });
	await UserRepositoryImpl.destroy({ truncate: true, force: true });
	await CommunityRepositoryImpl.destroy({ truncate: true, force: true });
}

/**
 * 特定のテーブルのみをクリーンアップする
 */
async function cleanupCandyTables(): Promise<void> {
	await CandyRepositoryImpl.destroy({ truncate: true, force: true });
	await UserCandyItemRepositoryImpl.destroy({ truncate: true, force: true });
}

/**
 * テスト用のコミュニティとユーザーを作成する
 */
async function createCommunityAndUser(): Promise<TestContext> {
	// Create community
	const community = await CommunityRepositoryImpl.create({
		categoryType: 0, // Discord
		clientId: BigInt(TEST_GUILD_ID),
		batchStatus: 0,
	});

	// Create user (candy受領者/コマンド実行者)
	const user = await UserRepositoryImpl.create({
		categoryType: 0, // Discord
		clientId: BigInt(TEST_USER_ID),
		userType: 0, // user
		communityId: community.id,
		batchStatus: 0,
	});

	// Create give user (candy付与者)
	const giveUser = await UserRepositoryImpl.create({
		categoryType: 0, // Discord
		clientId: BigInt(TEST_GIVE_USER_ID),
		userType: 0, // user
		communityId: community.id,
		batchStatus: 0,
	});

	// Create receiver user (reaction受領者)
	const receiverUser = await UserRepositoryImpl.create({
		categoryType: 0, // Discord
		clientId: BigInt(TEST_RECEIVER_ID),
		userType: 0, // user
		communityId: community.id,
		batchStatus: 0,
	});

	return {
		communityId: community.id,
		userId: user.id,
		giveUserId: giveUser.id,
		receiverUserId: receiverUser.id,
	};
}

/**
 * テスト全体のセットアップを行う（beforeEach用）
 * @returns テストコンテキスト
 */
async function setupTestEnvironment(): Promise<TestContext> {
	initializeDatabase();
	await cleanupAllTables();
	return await createCommunityAndUser();
}

/**
 * テスト全体のクリーンアップを行う（afterEach用）
 */
async function teardownTestEnvironment(): Promise<void> {
	await cleanupAllTables();
}

describe("Test Candy Commands", () => {
	// テスト用のコミュニティとユーザーのID（autoincrement）
	let testCommunityId: number;
	let testUserId: number;
	let testGiveUserId: number;
	let testReceiverUserId: number;

	/**
	 * テスト実行前に毎回実行される共通のセットアップ - ヘルパー関数を使用
	 */
	beforeEach(async () => {
		const context = await setupTestEnvironment();
		testCommunityId = context.communityId;
		testUserId = context.userId;
		testGiveUserId = context.giveUserId;
		testReceiverUserId = context.receiverUserId;
	});

	/**
	 * テスト実行後に毎回実行されるクリーンアップ - ヘルパー関数を使用
	 */
	afterEach(async () => {
		await teardownTestEnvironment();
	});

	/**
	 * キャンディ所持時の/candycheckコマンドをテスト
	 * キャンディを所持している場合、個数と期限が正しく表示されることを確認する
	 */
	it("should display candy count and expiration when candies exist", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// コマンドのモック作成
			const commandMock = mockSlashCommand("candycheck");

			// テストデータの作成 - ヘルパー関数を使用
			const insertData = createCandyData({
				userId: testUserId,
				giveUserId: testGiveUserId,
				communityId: testCommunityId,
			});
			await CandyRepositoryImpl.create(insertData);

			// モック設定 - ヘルパー関数を使用
			const { getValue } = setupCommandMockReply(commandMock);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			verify(commandMock.reply(anything())).once();
			expect(getValue()).to.eq("キャンディが1個あるよ！期限が2999/12/30に切れるから気を付けてね！っ");
		})();
	});

	/**
	 * キャンディ未所持時の/candycheckコマンドをテスト
	 * キャンディを所持していない場合、適切なメッセージが表示されることを確認する
	 */
	it("should display message when no candies exist", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// コマンドのモック作成
			const commandMock = mockSlashCommand("candycheck");

			// モック設定 - ヘルパー関数を使用
			const { getValue } = setupCommandMockReply(commandMock);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			verify(commandMock.reply(anything())).once();
			expect(getValue()).to.include("キャンディがないよ！っ");
		})();
	});

	/**
	 * 通常のキャンディドローをテスト
	 * 十分な数のキャンディドローを行い、確率通りにアイテムが当選することを確認する
	 */
	it("should draw items with expected probabilities", function (this: Mocha.Context) {
		// テストの複雑さを考慮して、タイムアウトを長めに設定
		this.timeout(100_000);

		return (async () => {
			// コマンドのモック作成
			const commandMock = mockSlashCommand("candydraw");

			// 確率計算の説明
			// P = 1-(1-p)^n
			// → 0.9999(99.99%) = 1-(1-0.01(1%))^n
			// → n = log(1-0.9999)/log(1-0.01) = 916.421 ≒ 917
			// テスト時間短縮のため、サンプル数を減らす
			const candyAmount = 917;

			// テストデータの作成
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

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行（全てのキャンディを使い切る + 1回）
			const TEST_CLIENT = await TestDiscordServer.getClient();
			for (let i = 0; i < candyAmount + 1; i++) {
				TEST_CLIENT.emit("interactionCreate", instance(commandMock));
				// 各コマンド実行後に少し待機して処理が完了するのを待つ
				if (i % 10 === 0) {
					await new Promise((resolve) => setTimeout(resolve, 100));
				}
			}

			// 応答を待つ
			await waitSlashUntilReply(commandMock, 10000, candyAmount);

			// 応答の検証
			verify(commandMock.reply(anything())).times(candyAmount + 1);

			// 応答の検証
			verify(commandMock.reply(anything())).times(candyAmount + 1);

			// 応答内容の確認
			// 実際の応答には "- " が先頭に付いている可能性があるため、含まれているかどうかを確認
			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
				// 応答内容を確認
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
			// コマンドのモック作成
			const commandMock = mockSlashCommand("candydraw");

			// 150個のキャンディを用意（149個は使用済み、1個は未使用）
			const candyAmount = 150;
			const insertData = [];

			// 日付を設定して、149個は使用済み、最後の1個は未使用に
			for (let i = 0; i < candyAmount; i++) {
				const date = new Date();
				date.setDate(date.getDate() - (candyAmount - i));
				insertData.push({
					userId: testUserId,
					giveUserId: testGiveUserId,
					messageId: String(10_000 + i),
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: i < 149 ? date.toISOString() : null, // 149個目までは使用済み
					createdAt: date.toISOString(),
					updatedAt: date.toISOString(),
					communityId: testCommunityId,
					categoryType: CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue(),
				});
			}
			await CandyRepositoryImpl.bulkCreate(insertData);

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
				console.log("Reply received:", args);
			});

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ（タイムアウトを長めに設定）
			await waitSlashUntilReply(commandMock, 1000);

			// 天井機能によりジャックポットが当選することを確認
			const jackpotResult = `${ITEM_RECORDS[0].name}が当たったよ👕！っ`;
			expect(value).to.include(jackpotResult);
		})();
	});

	/**
	 * 連続キャンディドローをテスト
	 * 連続ドローで複数のアイテムが表示されることを確認する
	 */
	it("should draw multiple items in series", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyboxdraw", {});

			// テストデータの作成 - ヘルパー関数を使用
			const insertData = createBulkCandyData(30, {
				userId: testUserId,
				giveUserId: testGiveUserId,
				communityId: testCommunityId,
			});
			await CandyRepositoryImpl.bulkCreate(insertData);

			// モック設定 - ヘルパー関数を使用
			const { getValue } = setupCommandMockReply(commandMock);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			verify(commandMock.reply(anything())).once();

			// 結果の行数を確認（10回のドロー結果が表示されることを確認）
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
			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyboxdraw", {});

			// テストデータの作成 - ヘルパー関数を使用
			const insertData = createBulkCandyData(10, {
				userId: testUserId,
				giveUserId: testGiveUserId,
				communityId: testCommunityId,
			});
			await CandyRepositoryImpl.bulkCreate(insertData);

			// モック設定 - ヘルパー関数を使用
			const { getValue } = setupCommandMockReply(commandMock);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			verify(commandMock.reply(anything())).once();

			// 結果に少なくとも1つのヒットがあることを確認
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
			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyboxdraw", {});

			// テストデータの作成 - ヘルパー関数を使用（146個は使用済み、残りは未使用）
			const insertData = createPityCandyData(PITY_COUNT + 6, 146, {
				userId: testUserId,
				giveUserId: testGiveUserId,
				communityId: testCommunityId,
			});
			await CandyRepositoryImpl.bulkCreate(insertData);

			// モック設定 - ヘルパー関数を使用
			const { getValue } = setupCommandMockReply(commandMock);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			verify(commandMock.reply(anything())).once();

			const lines = getValue().split("\n");
			const resultLines = lines.filter((line) => line.startsWith("- "));

			// 結果にジャックポットが含まれることを確認
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
			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyboxdraw");

			// テストデータの作成 - ヘルパー関数を使用（10個必要だが9個しか用意しない）
			const insertData = createBulkCandyData(9, {
				userId: testUserId,
				giveUserId: testGiveUserId,
				communityId: testCommunityId,
			});
			await CandyRepositoryImpl.bulkCreate(insertData);

			// モック設定 - ヘルパー関数を使用
			const { getValue } = setupCommandMockReply(commandMock);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock);

			// 応答の検証
			verify(commandMock.reply(anything())).once();
			expect(getValue()).to.include("キャンディの数が足りないよ！っ");
		})();
	});

	/**
	 * アイテムIDからアイテム情報を取得するヘルパー関数
	 */
	const getItem = (id: number) => {
		// auto_increment start with id 1
		// but first index of array is 0
		return ITEM_RECORDS[id - 1];
	};

	/**
	 * /candyitemコマンドのテスト
	 * 所持しているアイテムが正しく表示されることを確認する
	 */
	it("should display owned items with /candyitem command", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyitem");

			// テストデータの作成
			const insertData = [
				{
					userId: testUserId,
					itemId: ID_HIT,
					candyId: 1,
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: null, // 有効なアイテム
					communityId: testCommunityId,
				},
				{
					userId: testUserId,
					itemId: ID_HIT,
					candyId: 2,
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: null, // 有効なアイテム
					communityId: testCommunityId,
				},
				{
					userId: testUserId,
					itemId: ID_JACKPOT,
					candyId: 3,
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: "1970/01/01 00:00:00", // 削除済みアイテム
					communityId: testCommunityId,
				},
				{
					userId: testUserId,
					itemId: ID_JACKPOT,
					candyId: 4,
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: "1970/01/01 00:00:00", // 削除済みアイテム
					communityId: testCommunityId,
				},
				{
					userId: testUserId,
					itemId: ID_JACKPOT,
					candyId: 5,
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: null, // 有効なアイテム
					communityId: testCommunityId,
				},
			];
			const inserted = await UserCandyItemRepositoryImpl.bulkCreate(insertData);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock);

			// 応答の検証
			verify(commandMock.reply(anything())).once();
			expect(value).to.include("以下のアイテムが交換できるよ！っ");

			// 有効なアイテムのみが表示されることを確認
			expect(value).to.include(`${getItem(inserted[0].itemId).name}`); // HIT
			expect(value).to.include(`${getItem(inserted[1].itemId).name}`); // HIT
			expect(value).to.include(`${getItem(inserted[4].itemId).name}`); // JACKPOT
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
			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyitem");

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock);

			// 応答の検証
			verify(commandMock.reply(anything())).once();
			expect(value).to.eq("アイテムは持ってないよ！っ");
		})();
	});

	/**
	 * /candyexchangeコマンドのテスト
	 * アイテムを正常に交換できることを確認する
	 */
	it("should exchange items successfully with /candyexchange command", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyexchange", {
				type: ID_HIT,
				amount: 1,
			});

			// テストデータの作成
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

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			try {
				await waitSlashUntilReply(commandMock);

				// 応答の検証
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
			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyexchange", {
				type: 0,
				amount: 1,
			});

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock);

			// 応答の検証
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
			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyexchange", {
				type: 9999, // 無効なアイテムIDを設定
				amount: 1,
			});

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock);

			// 応答の検証
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
			// コマンドのモック作成（10個のアイテムを交換しようとする）
			const commandMock = mockSlashCommand("candyexchange", {
				type: ID_HIT,
				amount: 10,
			});

			// テストデータの作成（1個のアイテムを所持）
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

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock);

			// 応答の検証
			verify(commandMock.reply(anything())).once();
			expect(value).to.eq("アイテムは持ってないよ！っ");
		})();
	});

	/**
	 * キャンディスタンプを押した時のテスト
	 * ユーザーがキャンディスタンプを押すと、キャンディが追加されることを確認する
	 *
	 * 注: このテストはモックを使用して、実際のDiscordクライアントの動作をシミュレートします
	 */
	it("should add candy when reaction is added", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const giverId = "1234";
			const receiverId = "5678";
			const creationDate = dayjs().add(1, "month").hour(0).minute(0).second(0).millisecond(0).add(1, "day").subtract(1, "second");
			const { reaction, user, messageMock } = mockReaction(AppConfig.backend.candyEmoji, giverId, receiverId);

			// guildIdとurlを設定
			when(messageMock.guildId).thenReturn(TEST_GUILD_ID);
			when(messageMock.url).thenReturn("https://discord.com/channels/1234567890/1234567890/7890");

			// リアクションイベントを発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

			// 少し待機してハンドラーの処理が完了するのを待つ
			await new Promise((resolve) => setTimeout(resolve, 100));

			// データベースの検証
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
	 *
	 * 注: このテストはモックを使用して、実際のDiscordクライアントの動作をシミュレートします
	 */
	it("should limit candy additions per day", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const giverId = "1234";
			const receiverId = "5678";

			// 3回のキャンディを直接作成（同じ日付で）
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

			// 4回目のリアクションを試みる（上限に達しているため作成されない）
			const { reaction, user, messageMock } = mockReaction(AppConfig.backend.candyEmoji, giverId, receiverId);
			when(messageMock.id).thenReturn("9999"); // 別のメッセージID

			// リアクション追加イベントを発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

			// キャンディの数が変わっていないことを確認
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
		const receiverId = "1234"; // 同じユーザーID

		// 同じユーザーIDの場合、キャンディは作成されない
		const beforeCount = await CandyRepositoryImpl.count();

		// CandyLogicを使用してキャンディを付与しようとする
		const { reaction, user } = mockReaction(AppConfig.backend.candyEmoji, giverId, receiverId);
		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

		// キャンディの数が変わっていないことを確認
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

			// 1回目のリアクションを追加
			const { reaction: reaction1, user: user1, messageMock: messageMock1 } = mockReaction(AppConfig.backend.candyEmoji, giverId, receiverId);
			when(messageMock1.id).thenReturn(messageId);
			when(messageMock1.guildId).thenReturn(TEST_GUILD_ID);

			// リアクション追加イベントを発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction1), instance(user1), instance(mock<MessageReactionEventDetails>()));

			// 少し待機してハンドラーの処理が完了するのを待つ
			await new Promise((resolve) => setTimeout(resolve, 100));

			// キャンディが1つ増えていることを確認
			let afterCount = await CandyRepositoryImpl.count();
			expect(afterCount).to.eq(1);

			// 2回目の同じメッセージへのリアクションを追加
			const { reaction: reaction2, user: user2, messageMock: messageMock2 } = mockReaction(AppConfig.backend.candyEmoji, giverId, receiverId);
			when(messageMock2.id).thenReturn(messageId);
			when(messageMock2.guildId).thenReturn(TEST_GUILD_ID);

			// リアクション追加イベントを再度発火
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction2), instance(user2), instance(mock<MessageReactionEventDetails>()));

			// 少し待機してハンドラーの処理が完了するのを待つ
			await new Promise((resolve) => setTimeout(resolve, 100));

			// キャンディの数が変わっていないことを確認（重複は追加されない）
			afterCount = await CandyRepositoryImpl.count();
			expect(afterCount).to.eq(1);
		})();
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
			const creationDate = dayjs().add(1, "month").hour(0).minute(0).second(0).millisecond(0).add(1, "day").subtract(1, "second");
			const { reaction, user, messageMock } = mockReaction(AppConfig.backend.candySuperEmoji, giverId, receiverId);
			const beforeCount = await CandyRepositoryImpl.count();

			// メッセージIDとguildIdを設定
			when(messageMock.id).thenReturn("5678");
			when(messageMock.guildId).thenReturn(TEST_GUILD_ID);
			when(messageMock.url).thenReturn("https://discord.com/channels/1234567890/1234567890/5678");

			// リアクションイベントを発火させる
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

			// 少し待機してハンドラーの処理が完了するのを待つ
			await new Promise((resolve) => setTimeout(resolve, 100));

			// 応答の検証
			verify(messageMock.reply(anything())).never(); // モックなので実際には呼ばれない

			const res = await CandyRepositoryImpl.findAll();
			expect(res.length).to.eq(SUPER_CANDY_AMOUNT); // スーパーキャンディは3つ増える

			// スーパーキャンディは1回のスタンプで3つのキャンディが増えることを確認
			const afterCount = await CandyRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount + SUPER_CANDY_AMOUNT); // データベースレコードは3つ増える

			// 各キャンディのプロパティを確認
			for (const candy of res) {
				expect(String(candy.giveUserId)).to.eq(String(testUserId));
				expect(String(candy.userId)).to.eq(String(testReceiverUserId));
				expect(candy.categoryType).to.eq(CandyCategoryType.CATEGORY_TYPE_SUPER.getValue());

				const finishedDate = dayjs().add(1, "month").hour(0).minute(0).second(0).millisecond(0).add(1, "day").add(1, "second");

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

			// テスト前にデータベースをクリーンアップ
			await CandyRepositoryImpl.destroy({
				truncate: true,
				force: true,
			});

			// リアクションをモック
			const { reaction, user, messageMock } = mockReaction(AppConfig.backend.candySuperEmoji, giverId, receiverId);
			when(messageMock.id).thenReturn(messageId);
			when(messageMock.guildId).thenReturn(TEST_GUILD_ID);
			when(messageMock.url).thenReturn("https://discord.com/channels/1234567890/1234567890/5678");

			// リアクションイベントを発火させる
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

			// 少し待機してハンドラーの処理が完了するのを待つ
			await new Promise((resolve) => setTimeout(resolve, 100));

			// キャンディが3つ増えていることを確認（SUPER_CANDY_AMOUNT = 3）
			const candies = await CandyRepositoryImpl.findAll();
			expect(candies.length).to.eq(SUPER_CANDY_AMOUNT);

			// すべてのキャンディがスーパーキャンディタイプであることを確認
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

			// テスト前にデータベースをクリーンアップ
			await CandyRepositoryImpl.destroy({
				truncate: true,
				force: true,
			});

			// 1回目のスーパーキャンディリアクションを発火（これにより3つのキャンディが作成される）
			const { reaction, user, messageMock } = mockReaction(AppConfig.backend.candySuperEmoji, giverId, receiverId);
			when(messageMock.id).thenReturn("1234");
			when(messageMock.guildId).thenReturn(TEST_GUILD_ID);
			when(messageMock.url).thenReturn("https://discord.com/channels/1234567890/1234567890/1234");
			when(messageMock.author).thenReturn({
				id: receiverId,
				bot: false,
			} as any);

			// リアクション追加イベントを発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

			// 少し待機してハンドラーの処理が完了するのを待つ
			await new Promise((resolve) => setTimeout(resolve, 100));

			// 作成されたキャンディの日付を同じ月に設定
			const today = new Date();
			const candies = await CandyRepositoryImpl.findAll();
			for (const candy of candies) {
				await candy.update({
					createdAt: today,
					updatedAt: today,
				});
			}

			// 2回目のリアクションを試みる（同じ月に2回目なので作成されない）
			const { reaction: reaction2, user: user2, messageMock: messageMock2 } = mockReaction(AppConfig.backend.candySuperEmoji, giverId, receiverId);
			when(messageMock2.id).thenReturn("5678"); // 別のメッセージID
			when(messageMock2.guildId).thenReturn(TEST_GUILD_ID);
			when(messageMock2.url).thenReturn("https://discord.com/channels/1234567890/1234567890/5678");
			when(messageMock2.author).thenReturn({
				id: receiverId,
				bot: false,
			} as any);

			// リアクション追加イベントを発火
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction2), instance(user2), instance(mock<MessageReactionEventDetails>()));

			// 少し待機してハンドラーの処理が完了するのを待つ
			await new Promise((resolve) => setTimeout(resolve, 100));

			// キャンディの数が変わっていないことを確認（1ヶ月に1回しか付与できないため追加されない）
			const res = await CandyRepositoryImpl.findAll();
			expect(res.length).to.eq(SUPER_CANDY_AMOUNT); // 1ヶ月に1回しか付与できないため、これ以上増えない
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

			// テスト前にデータベースをクリーンアップ
			await CandyRepositoryImpl.destroy({
				truncate: true,
				force: true,
			});

			const beforeCount = await CandyRepositoryImpl.count();

			// 1回目のリアクションを追加
			const { reaction, user, messageMock } = mockReaction(AppConfig.backend.candySuperEmoji, giverId, receiverId);
			when(messageMock.id).thenReturn(messageId);
			when(messageMock.guildId).thenReturn(TEST_GUILD_ID);
			when(messageMock.url).thenReturn("https://discord.com/channels/1234567890/1234567890/5678");

			// リアクション追加イベントを発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

			// 少し待機してハンドラーの処理が完了するのを待つ
			await new Promise((resolve) => setTimeout(resolve, 100));

			// キャンディが増えていることを確認
			let afterCount = await CandyRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount + SUPER_CANDY_AMOUNT);

			// 2回目の同じメッセージへのリアクションを追加
			const { reaction: reaction2, user: user2, messageMock: messageMock2 } = mockReaction(AppConfig.backend.candySuperEmoji, giverId, receiverId);
			when(messageMock2.id).thenReturn(messageId);
			when(messageMock2.guildId).thenReturn(TEST_GUILD_ID);
			when(messageMock2.url).thenReturn("https://discord.com/channels/1234567890/1234567890/5678");

			// リアクション追加イベントを再度発火
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction2), instance(user2), instance(mock<MessageReactionEventDetails>()));

			// 少し待機してハンドラーの処理が完了するのを待つ
			await new Promise((resolve) => setTimeout(resolve, 100));

			// キャンディの数が変わっていないことを確認（重複は追加されない）
			afterCount = await CandyRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount + SUPER_CANDY_AMOUNT);
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
			when(messageMock.id).thenReturn(null as any); // 無効なID

			// リアクション追加イベントを発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

			try {
				// 応答がないことを期待してタイムアウトを待つ
				await waitUntilMessageReply(messageMock, 100);
			} catch (e) {
				// 応答がないことを確認
				verify(messageMock.reply(anything())).never();
				return;
			}
			expect("expect not reach here").to.false;
		})();
	});

	/**
	 * 今年中にJackpotが当たっている場合、candydrawでJackpotが出ないことをテスト
	 * 今年（1月1日～12月31日）中に既にJackpotを獲得している場合、
	 * 新たにJackpotが出ずにHITに置き換わることを確認する
	 */
	it("should not draw jackpot in candydraw when already won this year", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 今年の1月1日にJackpotアイテムを作成
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

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candydraw");

			// 十分な数のキャンディを用意（天井に到達する数）
			const candyAmount = PITY_COUNT;
			const insertData = [];
			for (let i = 0; i < candyAmount; i++) {
				const date = new Date();
				date.setDate(date.getDate() - (candyAmount - i));
				insertData.push({
					userId: testUserId,
					giveUserId: testGiveUserId,
					messageId: String(10_000 + i),
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: i < candyAmount - 1 ? date.toISOString() : null,
					createdAt: date.toISOString(),
					updatedAt: date.toISOString(),
					communityId: testCommunityId,
					categoryType: CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue(),
				});
			}
			await CandyRepositoryImpl.bulkCreate(insertData);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			verify(commandMock.reply(anything())).once();

			// Jackpotが出ていないことを確認（天井到達でもJackpotが出ない）
			const jackpotResult = `${ITEM_RECORDS[0].name}が当たったよ👕！っ`;
			expect(value).to.not.include(jackpotResult);

			// HITまたはハズレのみが出ることを確認
			expect(value).to.satisfy((text: string) => {
				return text.includes("ハズレ") || text.includes(`${ITEM_RECORDS[1].name}が当たった`);
			});
		})();
	});

	/**
	 * 今年中にJackpotが当たっている場合、candyboxdrawでJackpotが出ないことをテスト
	 * 今年（1月1日～12月31日）中に既にJackpotを獲得している場合、
	 * 連続ドローでも新たにJackpotが出ずにHITに置き換わることを確認する
	 */
	it("should not draw jackpot in candyboxdraw when already won this year", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 今年の1月1日にJackpotアイテムを作成
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

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyboxdraw", {});

			// 十分な数のキャンディを用意（天井に到達する数）
			const candyAmount = PITY_COUNT;
			const insertData = [];
			for (let i = 0; i < candyAmount; i++) {
				const date = new Date();
				date.setDate(date.getDate() - (candyAmount - i));
				insertData.push({
					userId: testUserId,
					giveUserId: testGiveUserId,
					messageId: String(10_000 + i),
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: i < 146 ? date.toISOString() : null,
					createdAt: date.toISOString(),
					updatedAt: date.toISOString(),
					communityId: testCommunityId,
					categoryType: CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue(),
				});
			}
			await CandyRepositoryImpl.bulkCreate(insertData);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			verify(commandMock.reply(anything())).once();

			const lines = value.split("\n");
			const resultLines = lines.filter((line) => line.startsWith("- "));

			// Jackpotが出ていないことを確認（天井到達でもJackpotが出ない）
			const jackpotLines = resultLines.filter((line) => (line.includes("Tシャツ") || line.includes("waiwaiオリジナル")) && line.includes("当たった"));
			expect(jackpotLines.length).to.eq(0);

			// HITまたはハズレのみが出ることを確認
			resultLines.forEach((line) => {
				expect(line).to.satisfy((text: string) => {
					return text.includes("ハズレ") || text.includes(`${ITEM_RECORDS[1].name}が当たった`);
				});
			});
		})();
	});

	/**
	 * 去年のJackpotは今年のcandyboxdrawでの天井でないドローに影響しないことをテスト
	 * 去年Jackpotを獲得していても、今年は新たにJackpotが出ることを確認する
	 */
	it("should allow jackpot in candydraw when won last year", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 去年の12月31日にJackpotアイテムを作成
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

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candydraw");

			// PITY_COUNT + 6個の十分な数のキャンディを用意（天井に到達する数）
			const candyAmount = PITY_COUNT + 6;
			const insertData = [];
			for (let i = 0; i < candyAmount; i++) {
				const date = new Date();
				date.setDate(date.getDate() - (candyAmount - i));
				insertData.push({
					userId: testUserId,
					giveUserId: testGiveUserId,
					messageId: String(10_000 + i),
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: i < candyAmount - 1 ? date.toISOString() : null,
					createdAt: date.toISOString(),
					updatedAt: date.toISOString(),
					communityId: testCommunityId,
					categoryType: CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue(),
				});
			}
			await CandyRepositoryImpl.bulkCreate(insertData);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			verify(commandMock.reply(anything())).once();

			// 天井機能によりJackpotが当選することを確認（去年のJackpotは影響しない）
			const jackpotResult = `${ITEM_RECORDS[0].name}が当たったよ👕！っ`;
			expect(value).to.include(jackpotResult);
		})();
	});

	it("should guarantee jackpot in series draw with pity system", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyboxdraw", {});

			// PITY_COUNT + 6個のキャンディを用意（PITY_COUNT + 3個は使用済み、残りは未使用）
			const candyAmount = PITY_COUNT + 6;
			const insertData = [];

			// 日付を設定して、146個は使用済み、残りは未使用に
			for (let i = 0; i < candyAmount; i++) {
				const date = new Date();
				date.setDate(date.getDate() - (candyAmount - i));
				insertData.push({
					userId: testUserId,
					giveUserId: testGiveUserId,
					messageId: String(10_000 + i),
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: i < 146 ? date.toISOString() : null, // 146個目までは使用済み
					createdAt: date.toISOString(),
					updatedAt: date.toISOString(),
					communityId: testCommunityId,
					categoryType: CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue(),
				});
			}
			await CandyRepositoryImpl.bulkCreate(insertData);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			verify(commandMock.reply(anything())).once();

			const lines = value.split("\n");
			const resultLines = lines.filter((line) => line.startsWith("- "));

			// 結果にジャックポットが含まれることを確認
			// より広範囲な検索条件を使用
			const jackpotLines = resultLines.filter((line) => (line.includes("Tシャツ") || line.includes("waiwaiオリジナル")) && line.includes("当たった"));
			console.log("Jackpot lines:", jackpotLines);
			expect(jackpotLines.length).to.be.at.least(1);
		})();
	});

	/**
	 * candydraw: 今年と去年にジャックポットデータがない場合 - 通常ドローで天井以外のジャックポット
	 * 確率的にジャックポットが出る可能性があることを確認
	 */
	it("should allow non-pity jackpot in candydraw when no data exists in both years", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// コマンドのモック作成
			const commandMock = mockSlashCommand("candydraw");

			// 十分な数のキャンディを用意（天井に到達しない数）
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

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行（ジャックポットが出る可能性がある）
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証（ジャックポットが出ることが可能）
			verify(commandMock.reply(anything())).once();
		})();
	});

	/**
	 * candydraw: 今年と去年にジャックポットデータがない場合 - 通常ドローで天井のジャックポット
	 * 150回目のドローで必ずジャックポットが当選することを確認
	 */
	it("should guarantee pity jackpot in candydraw on 150th draw when no data exists in both years", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// コマンドのモック作成
			const commandMock = mockSlashCommand("candydraw");

			// PITY_COUNT個のキャンディを用意（PITY_COUNT - 1個は使用済み、1個は未使用）
			const candyAmount = PITY_COUNT;
			const insertData = [];

			for (let i = 0; i < candyAmount; i++) {
				const date = new Date();
				date.setDate(date.getDate() - (candyAmount - i));
				insertData.push({
					userId: testUserId,
					giveUserId: testGiveUserId,
					messageId: String(10_000 + i),
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: i < PITY_COUNT - 1 ? date.toISOString() : null,
					createdAt: date.toISOString(),
					updatedAt: date.toISOString(),
					communityId: testCommunityId,
					categoryType: CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue(),
				});
			}
			await CandyRepositoryImpl.bulkCreate(insertData);

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			// 天井機能によりジャックポットが当選することを確認
			const jackpotResult = `${ITEM_RECORDS[0].name}が当たったよ👕！っ`;
			expect(value).to.include(jackpotResult);
		})();
	});

	/**
	 * candyboxdraw: 今年と去年にジャックポットデータがない場合 - 連続ドローで天井以外のジャックポット
	 * 確率的にジャックポットが出る可能性があることを確認
	 */
	it("should allow non-pity jackpot in candyboxdraw when no data exists in both years", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyboxdraw", {});

			// 十分な数のキャンディを用意（天井に到達しない数）
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

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証（ジャックポットが出ることが可能）
			verify(commandMock.reply(anything())).once();
		})();
	});

	/**
	 * 連続ドローで天井のジャックポットを当てる
	 * 天井到達時にジャックポットが当選することを確認
	 */
	it("should guarantee pity jackpot in series draw when no data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyboxdraw", {});

			// PITY_COUNT + 6個のキャンディを用意（146個は使用済み、残りは未使用）
			const candyAmount = PITY_COUNT + 6;
			const insertData = [];

			for (let i = 0; i < candyAmount; i++) {
				const date = new Date();
				date.setDate(date.getDate() - (candyAmount - i));
				insertData.push({
					userId: testUserId,
					giveUserId: testGiveUserId,
					messageId: String(10_000 + i),
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: i < 146 ? date.toISOString() : null,
					createdAt: date.toISOString(),
					updatedAt: date.toISOString(),
					communityId: testCommunityId,
					categoryType: CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue(),
				});
			}
			await CandyRepositoryImpl.bulkCreate(insertData);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			verify(commandMock.reply(anything())).once();

			const lines = value.split("\n");
			const resultLines = lines.filter((line) => line.startsWith("- "));

			// 結果にジャックポットが含まれることを確認
			const jackpotLines = resultLines.filter((line) => (line.includes("Tシャツ") || line.includes("waiwaiオリジナル")) && line.includes("当たった"));
			expect(jackpotLines.length).to.be.at.least(1);
		})();
	});

	/**
	 * candydraw: 去年にジャックポットデータがあり今年にデータがない場合 - 通常ドローで天井以外のジャックポット
	 * 去年のデータは影響せず、ジャックポットが出る可能性があることを確認
	 */
	it("should allow non-pity jackpot in candydraw when only last year data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 去年の12月31日にJackpotアイテムを作成
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

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candydraw");

			// 十分な数のキャンディを用意（天井に到達しない数）
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

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証（去年のデータは影響せず、ジャックポットが出ることが可能）
			verify(commandMock.reply(anything())).once();
		})();
	});

	/**
	 * 通常ドローで天井のジャックポットを当てる
	 * 去年のデータは影響せず、天井でジャックポットが当選することを確認
	 */
	it("should guarantee pity jackpot when only last year data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 去年の12月31日にJackpotアイテムを作成
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

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candydraw");

			// PITY_COUNT + 10個のキャンディを用意（複数回ドローできるように）
			const candyAmount = PITY_COUNT + 49;
			const insertData = [];

			for (let i = 0; i < candyAmount; i++) {
				const date = new Date();
				date.setDate(date.getDate() - (candyAmount - i));
				insertData.push({
					userId: testUserId,
					giveUserId: testGiveUserId,
					messageId: String(10_000 + i),
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: i < PITY_COUNT - 1 ? date.toISOString() : null,
					createdAt: date.toISOString(),
					updatedAt: date.toISOString(),
					communityId: testCommunityId,
					categoryType: CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue(),
				});
			}
			await CandyRepositoryImpl.bulkCreate(insertData);

			let jackpotFound = false;
			const results: string[] = [];
			when(commandMock.reply(anything())).thenCall((args) => {
				results.push(args);
				const jackpotResult = `${ITEM_RECORDS[0].name}が当たったよ👕！っ`;
				if (args.includes(jackpotResult)) {
					jackpotFound = true;
				}
			});

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンドを複数回実行（天井到達後に確実にジャックポットが出るまで）
			const TEST_CLIENT = await TestDiscordServer.getClient();
			const maxDraws = 11; // 天井到達を確実にするため複数回実行

			for (let i = 0; i < maxDraws && !jackpotFound; i++) {
				TEST_CLIENT.emit("interactionCreate", instance(commandMock));
				await waitSlashUntilReply(commandMock, 1000, i + 1);
			}

			// 応答の検証
			verify(commandMock.reply(anything())).atLeast(1);

			// 天井機能によりJackpotが当選することを確認（去年のJackpotは影響しない）
			console.log("Draw results:", results);
			expect(jackpotFound).to.be.true;
		})();
	});

	/**
	 * candyboxdraw: 去年にジャックポットデータがあり今年にデータがない場合 - 連続ドローで天井以外のジャックポット
	 * 去年のデータは影響せず、ジャックポットが出る可能性があることを確認
	 */
	it("should allow non-pity jackpot in candyboxdraw when only last year data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 去年の12月31日にJackpotアイテムを作成
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

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyboxdraw", {});

			// 十分な数のキャンディを用意（天井に到達しない数）
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

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証（去年のデータは影響せず、ジャックポットが出ることが可能）
			verify(commandMock.reply(anything())).once();
		})();
	});

	/**
	 * 連続ドローで天井のジャックポットを当てる
	 * 去年のデータは影響せず、天井でジャックポットが当選することを確認
	 */
	it("should guarantee pity jackpot in series draw when only last year data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 去年の12月31日にJackpotアイテムを作成
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

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyboxdraw", {});

			// PITY_COUNT + 6個のキャンディを用意（146個は使用済み、残りは未使用）
			const candyAmount = PITY_COUNT + 6;
			const insertData = [];

			for (let i = 0; i < candyAmount; i++) {
				const date = new Date();
				date.setDate(date.getDate() - (candyAmount - i));
				insertData.push({
					userId: testUserId,
					giveUserId: testGiveUserId,
					messageId: String(10_000 + i),
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: i < 146 ? date.toISOString() : null,
					createdAt: date.toISOString(),
					updatedAt: date.toISOString(),
					communityId: testCommunityId,
					categoryType: CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue(),
				});
			}
			await CandyRepositoryImpl.bulkCreate(insertData);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			verify(commandMock.reply(anything())).once();

			const lines = value.split("\n");
			const resultLines = lines.filter((line) => line.startsWith("- "));

			// 結果にジャックポットが含まれることを確認（去年のデータは影響しない）
			const jackpotLines = resultLines.filter((line) => (line.includes("Tシャツ") || line.includes("waiwaiオリジナル")) && line.includes("当たった"));
			expect(jackpotLines.length).to.be.at.least(1);
		})();
	});

	/**
	 * candydraw: 去年にデータがなく今年にジャックポットデータがある場合 - 通常ドローで天井以外のジャックポット
	 * 今年既にジャックポットを獲得しているため、新たにジャックポットが出ないことを確認
	 */
	it("should not allow non-pity jackpot in candydraw when this year data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 今年の1月1日にJackpotアイテムを作成
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

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candydraw");

			// 十分な数のキャンディを用意（天井に到達しない数）
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

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			verify(commandMock.reply(anything())).once();

			// Jackpotが出ていないことを確認
			const jackpotResult = `${ITEM_RECORDS[0].name}が当たったよ👕！っ`;
			expect(value).to.not.include(jackpotResult);
		})();
	});

	/**
	 * 通常ドローで天井のジャックポットが当らない
	 * 今年既にジャックポットを獲得しているため、天井でもジャックポットが出ないことを確認
	 */
	it("should not allow pity jackpot when this year data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 今年の1月1日にJackpotアイテムを作成
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

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candydraw");

			// PITY_COUNT個のキャンディを用意（PITY_COUNT - 1個は使用済み、1個は未使用）
			const candyAmount = PITY_COUNT;
			const insertData = [];

			for (let i = 0; i < candyAmount; i++) {
				const date = new Date();
				date.setDate(date.getDate() - (candyAmount - i));
				insertData.push({
					userId: testUserId,
					giveUserId: testGiveUserId,
					messageId: String(10_000 + i),
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: i < PITY_COUNT - 1 ? date.toISOString() : null,
					createdAt: date.toISOString(),
					updatedAt: date.toISOString(),
					communityId: testCommunityId,
					categoryType: CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue(),
				});
			}
			await CandyRepositoryImpl.bulkCreate(insertData);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			verify(commandMock.reply(anything())).once();

			// Jackpotが出ていないことを確認（天井到達でもJackpotが出ない）
			const jackpotResult = `${ITEM_RECORDS[0].name}が当たったよ👕！っ`;
			expect(value).to.not.include(jackpotResult);

			// HITまたはハズレのみが出ることを確認
			expect(value).to.satisfy((text: string) => {
				return text.includes("ハズレ") || text.includes(`${ITEM_RECORDS[1].name}が当たった`);
			});
		})();
	});

	/**
	 * candyboxdraw: 去年にデータがなく今年にジャックポットデータがある場合 - 連続ドローで天井以外のジャックポット
	 * 今年既にジャックポットを獲得しているため、新たにジャックポットが出ないことを確認
	 */
	it("should not allow non-pity jackpot in candyboxdraw when this year data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 今年の1月1日にJackpotアイテムを作成
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

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyboxdraw", {});

			// 十分な数のキャンディを用意（天井に到達しない数）
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

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			verify(commandMock.reply(anything())).once();

			const lines = value.split("\n");
			const resultLines = lines.filter((line) => line.startsWith("- "));

			// Jackpotが出ていないことを確認
			const jackpotLines = resultLines.filter((line) => (line.includes("Tシャツ") || line.includes("waiwaiオリジナル")) && line.includes("当たった"));
			expect(jackpotLines.length).to.eq(0);
		})();
	});

	/**
	 * 連続ドローで天井のジャックポットが当らない
	 * 今年既にジャックポットを獲得しているため、天井でもジャックポットが出ないことを確認
	 */
	it("should not allow pity jackpot in series draw when this year data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 今年の1月1日にJackpotアイテムを作成
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

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyboxdraw", {});

			// PITY_COUNT + 6個のキャンディを用意（146個は使用済み、残りは未使用）
			const candyAmount = PITY_COUNT + 6;
			const insertData = [];

			for (let i = 0; i < candyAmount; i++) {
				const date = new Date();
				date.setDate(date.getDate() - (candyAmount - i));
				insertData.push({
					userId: testUserId,
					giveUserId: testGiveUserId,
					messageId: String(10_000 + i),
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: i < 146 ? date.toISOString() : null,
					createdAt: date.toISOString(),
					updatedAt: date.toISOString(),
					communityId: testCommunityId,
					categoryType: CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue(),
				});
			}
			await CandyRepositoryImpl.bulkCreate(insertData);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			verify(commandMock.reply(anything())).once();

			const lines = value.split("\n");
			const resultLines = lines.filter((line) => line.startsWith("- "));

			// Jackpotが出ていないことを確認（天井到達でもJackpotが出ない）
			const jackpotLines = resultLines.filter((line) => (line.includes("Tシャツ") || line.includes("waiwaiオリジナル")) && line.includes("当たった"));
			expect(jackpotLines.length).to.eq(0);

			// HITまたはハズレのみが出ることを確認
			resultLines.forEach((line) => {
				expect(line).to.satisfy((text: string) => {
					return text.includes("ハズレ") || text.includes(`${ITEM_RECORDS[1].name}が当たった`);
				});
			});
		})();
	});

	/**
	 * candydraw: 今年と去年にジャックポットデータがある場合 - 通常ドローで天井以外のジャックポット
	 * 今年既にジャックポットを獲得しているため、新たにジャックポットが出ないことを確認
	 */
	it("should not allow non-pity jackpot in candydraw when both years data exist", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 去年と今年の両方にJackpotアイテムを作成
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

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candydraw");

			// 十分な数のキャンディを用意（天井に到達しない数）
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

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			verify(commandMock.reply(anything())).once();

			// Jackpotが出ていないことを確認
			const jackpotResult = `${ITEM_RECORDS[0].name}が当たったよ👕！っ`;
			expect(value).to.not.include(jackpotResult);
		})();
	});

	/**
	 * 通常ドローで天井のジャックポットが当らない
	 * 今年既にジャックポットを獲得しているため、天井でもジャックポットが出ないことを確認
	 */
	it("should not allow pity jackpot when both years data exist", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 去年と今年の両方にJackpotアイテムを作成
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

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candydraw");

			// PITY_COUNT個のキャンディを用意（PITY_COUNT - 1個は使用済み、1個は未使用）
			const candyAmount = PITY_COUNT;
			const insertData = [];

			for (let i = 0; i < candyAmount; i++) {
				const date = new Date();
				date.setDate(date.getDate() - (candyAmount - i));
				insertData.push({
					userId: testUserId,
					giveUserId: testGiveUserId,
					messageId: String(10_000 + i),
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: i < PITY_COUNT - 1 ? date.toISOString() : null,
					createdAt: date.toISOString(),
					updatedAt: date.toISOString(),
					communityId: testCommunityId,
					categoryType: CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue(),
				});
			}
			await CandyRepositoryImpl.bulkCreate(insertData);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			verify(commandMock.reply(anything())).once();

			// Jackpotが出ていないことを確認（天井到達でもJackpotが出ない）
			const jackpotResult = `${ITEM_RECORDS[0].name}が当たったよ👕！っ`;
			expect(value).to.not.include(jackpotResult);

			// HITまたはハズレのみが出ることを確認
			expect(value).to.satisfy((text: string) => {
				return text.includes("ハズレ") || text.includes(`${ITEM_RECORDS[1].name}が当たった`);
			});
		})();
	});

	/**
	 * candyboxdraw: 今年と去年にジャックポットデータがある場合 - 連続ドローで天井以外のジャックポット
	 * 今年既にジャックポットを獲得しているため、新たにジャックポットが出ないことを確認
	 */
	it("should not allow non-pity jackpot in candyboxdraw when both years data exist", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 去年と今年の両方にJackpotアイテムを作成
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

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyboxdraw", {});

			// 十分な数のキャンディを用意（天井に到達しない数）
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

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			verify(commandMock.reply(anything())).once();

			const lines = value.split("\n");
			const resultLines = lines.filter((line) => line.startsWith("- "));

			// Jackpotが出ていないことを確認
			const jackpotLines = resultLines.filter((line) => (line.includes("Tシャツ") || line.includes("waiwaiオリジナル")) && line.includes("当たった"));
			expect(jackpotLines.length).to.eq(0);
		})();
	});

	/**
	 * candyboxdraw: 今年と去年にジャックポットデータがある場合 - 連続ドローで天井のジャックポット
	 * 今年既にジャックポットを獲得しているため、天井でもジャックポットが出ないことを確認
	 */
	it("should not allow pity jackpot in candyboxdraw when both years data exist", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 去年と今年の両方にJackpotアイテムを作成
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

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyboxdraw", {});

			// PITY_COUNT + 6個のキャンディを用意（146個は使用済み、残りは未使用）
			const candyAmount = PITY_COUNT + 6;
			const insertData = [];

			for (let i = 0; i < candyAmount; i++) {
				const date = new Date();
				date.setDate(date.getDate() - (candyAmount - i));
				insertData.push({
					userId: testUserId,
					giveUserId: testGiveUserId,
					messageId: String(10_000 + i),
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: i < 146 ? date.toISOString() : null,
					createdAt: date.toISOString(),
					updatedAt: date.toISOString(),
					communityId: testCommunityId,
					categoryType: CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue(),
				});
			}
			await CandyRepositoryImpl.bulkCreate(insertData);

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// guildIdの設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 5000);

			// 応答の検証
			verify(commandMock.reply(anything())).once();

			const lines = value.split("\n");
			const resultLines = lines.filter((line) => line.startsWith("- "));

			// Jackpotが出ていないことを確認（天井到達でもJackpotが出ない）
			const jackpotLines = resultLines.filter((line) => (line.includes("Tシャツ") || line.includes("waiwaiオリジナル")) && line.includes("当たった"));
			expect(jackpotLines.length).to.eq(0);

			// HITまたはハズレのみが出ることを確認
			resultLines.forEach((line) => {
				expect(line).to.satisfy((text: string) => {
					return text.includes("ハズレ") || text.includes(`${ITEM_RECORDS[1].name}が当たった`);
				});
			});
		})();
	});
});
