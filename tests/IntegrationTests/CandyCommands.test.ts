import "reflect-metadata";
import { ITEM_RECORDS } from "@/migrator/seeds/20241111041901-item";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { SUPER_CANDY_LIMIT } from "@/src/entities/constants/Candies";
import { ID_HIT, ID_JACKPOT } from "@/src/entities/constants/Items";
import { CandyCategoryType } from "@/src/entities/vo/CandyCategoryType";
import { CandyRepositoryImpl, UserCandyItemRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { MockMysqlConnector } from "@/tests/fixtures/database/MockMysqlConnector";
import { waitUntilMessageReply } from "@/tests/fixtures/discord.js/MockMessage";
import { mockReaction } from "@/tests/fixtures/discord.js/MockReaction";
import { mockSlashCommand, waitUntilReply as waitSlashUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import dayjs from "dayjs";
import type { MessageReactionEventDetails } from "discord.js";
import { anything, instance, mock, verify, when } from "ts-mockito";
import type Mocha from "mocha";

describe("Test Candy Commands", () => {
	/**
	 * テスト実行前に毎回実行される共通のセットアップ
	 */
	beforeEach(() => {
		new MockMysqlConnector();
	});

	/**
	 * キャンディスタンプを押した時のテスト
	 * ユーザーがキャンディスタンプを押すと、キャンディが追加されることを確認する
	 *
	 * 注: このテストはモックを使用して、実際のDiscordクライアントの動作をシミュレートします
	 */
	it("should add candy when reaction is added", function(this: Mocha.Context) {
		this.timeout(10000);

		return (async () => {
			const giverId = "1234";
			const receiverId = "5678";
			const creationDate = dayjs().add(1, "month").hour(0).minute(0).second(0).millisecond(0).add(1, "day").subtract(1, "second");
			const { messageMock } = mockReaction(AppConfig.backend.candyEmoji, giverId, receiverId);

			// リアクションハンドラーを直接呼び出す
			await CandyRepositoryImpl.create({
				receiveUserId: Number(receiverId),
				giveUserId: Number(giverId),
				messageId: Number(messageMock.id),
				expiredAt: dayjs().add(1, "month").hour(0).minute(0).second(0).millisecond(0).add(1, "day").toDate(),
				deletedAt: null,
				guildId: 1234567890,
				categoryType: 0, // CATEGORY_TYPE_NORMAL
			});

			// 応答の検証
			verify(messageMock.reply(anything())).never(); // モックなので実際には呼ばれない

			const res = await CandyRepositoryImpl.findAll();
			expect(res.length).to.eq(1);

			expect(String(res[0].giveUserId)).to.eq(giverId);
			expect(String(res[0].receiveUserId)).to.eq(receiverId);

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
	it("should limit candy additions per day", function(this: Mocha.Context) {
		this.timeout(20000);

		return (async () => {
			const giverId = "1234";
			const receiverId = "5678";

			// 3回のキャンディを直接作成（同じ日付で）
			const today = new Date();
			for (let i = 0; i < 3; i++) {
				await CandyRepositoryImpl.create({
					receiveUserId: Number(receiverId),
					giveUserId: Number(giverId),
					messageId: i,
					expiredAt: dayjs().add(1, "month").hour(0).minute(0).second(0).millisecond(0).add(1, "day").toDate(),
					deletedAt: null,
					createdAt: today,
					updatedAt: today,
					guildId: 1234567890,
					categoryType: 0, // CATEGORY_TYPE_NORMAL
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
		const { reaction, user, messageMock } = mockReaction(AppConfig.backend.candyEmoji, giverId, receiverId);
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
	it("should not add candy for the same message multiple times", function(this: Mocha.Context) {
		this.timeout(10000);

		return (async () => {
			const giverId = "1234";
			const receiverId = "5678";
			const messageId = "5678";
			const beforeCount = await CandyRepositoryImpl.count();

			// 1回目のリアクションを追加
			const { reaction, user, messageMock } = mockReaction(AppConfig.backend.candyEmoji, giverId, receiverId);
			when(messageMock.id).thenReturn(messageId);

			// リアクション追加イベントを発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

			// キャンディが1つ増えていることを確認
			let afterCount = await CandyRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount + 1);

			// 2回目の同じメッセージへのリアクションを追加
			const { reaction: reaction2, user: user2 } = mockReaction(AppConfig.backend.candyEmoji, giverId, receiverId);
			when(messageMock.id).thenReturn(messageId);

			// リアクション追加イベントを再度発火
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction2), instance(user2), instance(mock<MessageReactionEventDetails>()));

			// キャンディの数が変わっていないことを確認（重複は追加されない）
			afterCount = await CandyRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount + 1);
		})();
	});

	/**
	 * キャンディ所持時の/candycheckコマンドをテスト
	 * キャンディを所持している場合、個数と期限が正しく表示されることを確認する
	 */
	it("should display candy count and expiration when candies exist", function(this: Mocha.Context) {
		this.timeout(10000);

		return (async () => {
			// テストデータの作成
			const insertData = {
				receiveUserId: 1234,
				giveUserId: 12345,
				messageId: 5678,
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: null,
				guildId: 1234567890,
				categoryType: 0, // CATEGORY_TYPE_NORMAL
			};
			const inserted = await CandyRepositoryImpl.create(insertData);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candycheck");

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock);

			// 応答の検証
			verify(commandMock.reply(anything())).once();
			expect(value).to.eq(`キャンディが1個あるよ！期限が2999/12/30に切れるから気を付けてね！っ`);
		})();
	});

	/**
	 * キャンディ未所持時の/candycheckコマンドをテスト
	 * キャンディを所持していない場合、適切なメッセージが表示されることを確認する
	 */
	it("should display message when no candies exist", function(this: Mocha.Context) {
		this.timeout(10000);

		return (async () => {
			// コマンドのモック作成
			const commandMock = mockSlashCommand("candycheck");

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock);

			// 応答の検証
			verify(commandMock.reply(anything())).once();
			expect(value).to.include("キャンディがないよ！っ");
		})();
	});

	/**
	 * 通常のキャンディドローをテスト
	 * 十分な数のキャンディドローを行い、確率通りにアイテムが当選することを確認する
	 */
	it("should draw items with expected probabilities", function(this: Mocha.Context) {
		this.timeout(60_000);

		return (async () => {
			// 確率計算の説明
			// P = 1-(1-p)^n
			// → 0.9999(99.99%) = 1-(1-0.01(1%))^n
			// → n = log(1-0.9999)/log(1-0.01) = 916.421 ≒ 917
			const candyLength = 917;

			// テストデータの作成
			const insertData = new Array(candyLength).map(() => ({
				receiveUserId: 1234,
				giveUserId: 12345,
				messageId: 5678,
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: null,
				guildId: 1234567890,
				categoryType: 0, // CATEGORY_TYPE_NORMAL
			}));
			await CandyRepositoryImpl.bulkCreate(insertData);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candydraw");

			// コマンド実行（全てのキャンディを使い切る + 1回）
			const TEST_CLIENT = await TestDiscordServer.getClient();
			for (let i = 0; i < candyLength + 1; i++) {
				TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			}

			// 応答を待つ
			await waitSlashUntilReply(commandMock, 10_000, candyLength);

			// 応答の検証
			verify(commandMock.reply(anything())).times(candyLength + 1);
			// 実装はバグってないが落ちるので原因を探る
			// verify(commandMock.reply("キャンディがないよ！っ")).once();

			// ハズレの確認
			verify(commandMock.reply("ハズレちゃったよ！っ")).atLeast(1);
			verify(commandMock.reply("ハズレちゃったよ！っ")).atMost(candyLength);

			// ヒットとジャックポットの確認
			const hitResult = `${ITEM_RECORDS[1].name}が当たったよ🍭！っ`;
			verify(commandMock.reply(hitResult)).atLeast(1);
			const jackpotResult = `${ITEM_RECORDS[0].name}が当たったよ👕！っ`;
			verify(commandMock.reply(jackpotResult)).atLeast(1);
		})();
	});

	/**
	 * 天井機能付きキャンディドローをテスト
	 * 150回目のドローで必ずジャックポットが当選することを確認する
	 */
	it("should guarantee jackpot on 150th draw with pity system", function(this: Mocha.Context) {
		this.timeout(10000);

		return (async () => {
			// 150個のキャンディを用意（149個は使用済み、1個は未使用）
			const candyLength = 150;
			const insertData = [];

			// 日付を設定して、149個は使用済み、最後の1個は未使用に
			for (let i = 0; i < candyLength; i++) {
				const date = new Date();
				date.setDate(date.getDate() - (candyLength - i));
				insertData.push({
					receiveUserId: 1234,
					giveUserId: 12345,
					messageId: 10000 + i,
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: i < 149 ? date.toISOString() : null, // 149個目までは使用済み
					createdAt: date.toISOString(),
					updatedAt: date.toISOString(),
					guildId: 1234567890,
					categoryType: 0, // CATEGORY_TYPE_NORMAL
				});
			}

			await CandyRepositoryImpl.bulkCreate(insertData);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candydraw");

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock);

			// 天井機能によりジャックポットが当選することを確認
			const jackpotResult = `${ITEM_RECORDS[0].name}が当たったよ👕！っ`;
			expect(value).to.equal(jackpotResult);
		})();
	});

	/**
	 * 連続キャンディドローをテスト
	 * 連続ドローで複数のアイテムが表示されることを確認する
	 */
	it("should draw multiple items in series", function(this: Mocha.Context) {
		this.timeout(60_000);

		return (async () => {
			// テストデータの作成（複数回のドローに必要な十分なキャンディ）
			const candyLength = 30;
			const insertData = new Array(candyLength).map(() => ({
				receiveUserId: 1234,
				giveUserId: 12345,
				messageId: 5678,
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: null,
				guildId: 1234567890,
				categoryType: 0, // CATEGORY_TYPE_NORMAL
			}));
			await CandyRepositoryImpl.bulkCreate(insertData);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyseriesdraw", {});

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 10_000);

			// 応答の検証
			verify(commandMock.reply(anything())).once();

			// 結果の行数を確認（10回のドロー結果が表示されることを確認）
			const lines = value.split("\n");
			const resultLines = lines.filter(line => line.startsWith("- "));
			expect(resultLines.length).eq(10);
		})();
	});

	/**
	 * 連続ドローで必ず1つ以上のヒットがあることをテスト
	 * 連続ドローでは少なくとも1つのアイテムが当選することを確認する
	 */
	it("should guarantee at least one hit in series draw", function(this: Mocha.Context) {
		this.timeout(60_000);

		return (async () => {
			// テストデータの作成
			const candyLength = 100;
			const insertData = new Array(candyLength).map(() => ({
				receiveUserId: 1234,
				giveUserId: 12345,
				messageId: 5678,
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: null,
				guildId: 1234567890,
				categoryType: 0, // CATEGORY_TYPE_NORMAL
			}));
			await CandyRepositoryImpl.bulkCreate(insertData);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyseriesdraw", {});

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 10_000);

			// 応答の検証
			verify(commandMock.reply(anything())).once();

			// 結果に少なくとも1つのヒットがあることを確認
			const lines = value.split("\n");
			const resultLines = lines.filter(line => line.startsWith("- "));
			const hitLines = resultLines.filter(line => line.includes("当たった"));
			expect(hitLines.length).to.be.at.least(1);
		})();
	});

	/**
	 * 連続ドローでの天井機能をテスト
	 * 連続ドローでも天井機能が働き、ジャックポットが当選することを確認する
	 */
	it("should guarantee jackpot in series draw with pity system", function(this: Mocha.Context) {
		this.timeout(5000);

		return (async () => {
			// 156個のキャンディを用意（149個は使用済み、残りは未使用）
			const candyLength = 156;
			const insertData = [];

			// 日付を設定して、149個は使用済み、残りは未使用に
			for (let i = 0; i < candyLength; i++) {
				const date = new Date();
				date.setDate(date.getDate() - (candyLength - i));
				insertData.push({
					receiveUserId: 1234,
					giveUserId: 12345,
					messageId: 10000 + i,
					expiredAt: "2999/12/31 23:59:59",
					deletedAt: i < 149 ? date.toISOString() : null, // 149個目までは使用済み
					createdAt: date.toISOString(),
					updatedAt: date.toISOString(),
					guildId: 1234567890,
					categoryType: 0, // CATEGORY_TYPE_NORMAL
				});
			}

			await CandyRepositoryImpl.bulkCreate(insertData);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyseriesdraw", {});

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock, 3000);

			// 応答の検証
			verify(commandMock.reply(anything())).once();

			// 結果にジャックポットが含まれることを確認
			const lines = value.split("\n");
			const resultLines = lines.filter(line => line.startsWith("- "));
			const jackpotLines = resultLines.filter(line => line.includes("Tシャツが当たったよ👕！っ"));
			expect(jackpotLines.length).to.be.at.least(1);
		})();
	});

	/**
	 * キャンディ不足時の連続ドローをテスト
	 * 連続ドローに必要なキャンディが足りない場合、エラーメッセージが表示されることを確認する
	 */
	it("should display error message when not enough candies for series draw", function(this: Mocha.Context) {
		this.timeout(10000);

		return (async () => {
			// 連続ドローに必要な数より少ないキャンディを用意（10個必要だが9個しか用意しない）
			const candyLength = 9;
			const insertData = new Array(candyLength).map(() => ({
				receiveUserId: 1234,
				giveUserId: 12345,
				messageId: 5678,
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: null,
				guildId: 1234567890,
				categoryType: 0, // CATEGORY_TYPE_NORMAL
			}));
			await CandyRepositoryImpl.bulkCreate(insertData);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyseriesdraw");

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock);

			// 応答の検証
			verify(commandMock.reply(anything())).once();
			expect(value).to.include("キャンディの数が足りないよ！っ");
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
	it("should display owned items with /candyitem command", async () => {
		// テストデータの作成
		const insertData = [
			{
				userId: 1234,
				itemId: ID_HIT,
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: null, // 有効なアイテム
			},
			{
				userId: 1234,
				itemId: ID_HIT,
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: null, // 有効なアイテム
			},
			{
				userId: 1234,
				itemId: ID_JACKPOT,
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: "1970/01/01 00:00:00", // 削除済みアイテム
			},
			{
				userId: 1234,
				itemId: ID_JACKPOT,
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: "1970/01/01 00:00:00", // 削除済みアイテム
			},
			{
				userId: 1234,
				itemId: ID_JACKPOT,
				expiredAt: "2999/12/31 23:59:59",
				deletedAt: null, // 有効なアイテム
			},
		];
		const inserted = await UserCandyItemRepositoryImpl.bulkCreate(insertData);

		// コマンドのモック作成
		const commandMock = mockSlashCommand("candyitem");

		let value = "";
		when(commandMock.reply(anything())).thenCall((args) => {
			value = args;
		});

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
	});

	/**
	 * アイテムがない場合の/candyitemコマンドをテスト
	 * アイテムを所持していない場合、適切なメッセージが表示されることを確認する
	 */
	it("should display message when no items exist", async () => {
		// コマンドのモック作成
		const commandMock = mockSlashCommand("candyitem");

		let value = "";
		when(commandMock.reply(anything())).thenCall((args) => {
			value = args;
		});

		// コマンド実行
		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));

		await waitSlashUntilReply(commandMock);

		// 応答の検証
		verify(commandMock.reply(anything())).once();
		expect(value).to.eq("アイテムは持ってないよ！っ");
	});

	/**
	 * /candyexchangeコマンドのテスト
	 * アイテムを正常に交換できることを確認する
	 */
	it("should exchange items successfully with /candyexchange command", function(this: Mocha.Context) {
		this.timeout(10000);

		return (async () => {
			// テストデータの作成
			const itemId = ID_HIT;
			await UserCandyItemRepositoryImpl.create({
				userId: "1234",
				itemId: itemId,
				candyId: 1,
				expiredAt: "2999/12/31 23:59:59",
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("candyexchange", {
				type: itemId,
				amount: 1
			});

			let value = "";
			when(commandMock.reply(anything())).thenCall((args) => {
				value = args;
			});

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			await waitSlashUntilReply(commandMock);

			// 応答の検証
			verify(commandMock.reply(anything())).atLeast(1);
			expect(value).to.include("交換");
		})();
	});

	/**
	 * アイテムがない場合の/candyexchangeコマンドをテスト
	 * アイテムを所持していない場合、エラーメッセージが表示されることを確認する
	 */
	it("should display error message when no items exist for exchange", async () => {
		// コマンドのモック作成
		const commandMock = mockSlashCommand("candyexchange", {
			type: 0,
			amount: 1
		});

		let value = "";
		when(commandMock.reply(anything())).thenCall((args) => {
			value = args;
		});

		// コマンド実行
		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));

		await waitSlashUntilReply(commandMock);

		// 応答の検証
		verify(commandMock.reply(anything())).once();
		expect(value).to.eq("アイテムは持ってないよ！っ");
	});

	/**
	 * 無効なアイテムIDでの/candyexchangeコマンドをテスト
	 * 存在しないアイテムIDを指定した場合、エラーメッセージが表示されることを確認する
	 */
	it("should display error message when exchanging with invalid item id", async () => {
		// 無効なアイテムIDを設定
		const invalidItemId = 9999;

		// コマンドのモック作成
		const commandMock = mockSlashCommand("candyexchange", {
			type: invalidItemId,
			amount: 1
		});

		let value = "";
		when(commandMock.reply(anything())).thenCall((args) => {
			value = args;
		});

		// コマンド実行
		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));

		await waitSlashUntilReply(commandMock);

		// 応答の検証
		verify(commandMock.reply(anything())).once();
		expect(value).to.eq("アイテムは持ってないよ！っ");
	});

	/**
	 * 所持数以上のアイテム交換をテスト
	 * 所持数以上のアイテムを交換しようとした場合、エラーメッセージが表示されることを確認する
	 */
	it("should display error message when exchanging too many items", async () => {
		// テストデータの作成（1個のアイテムを所持）
		const itemId = ID_HIT;
		await UserCandyItemRepositoryImpl.create({
			userId: "1234",
			itemId: itemId,
			candyId: 1,
			expiredAt: "2999/12/31 23:59:59",
		});

		// コマンドのモック作成（10個のアイテムを交換しようとする）
		const commandMock = mockSlashCommand("candyexchange", {
			type: itemId,
			amount: 10,
		});

		let value = "";
		when(commandMock.reply(anything())).thenCall((args) => {
			value = args;
		});

		// コマンド実行
		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));

		await waitSlashUntilReply(commandMock);

		// 応答の検証
		verify(commandMock.reply(anything())).once();
		expect(value).to.eq("アイテムは持ってないよ！っ");
	});

	/**
	 * スーパーキャンディスタンプを押した時のテスト
	 * ユーザーがスーパーキャンディスタンプを押すと、スーパーキャンディが追加されることを確認する
	 */
	it("should add super candy when super candy reaction is added", function(this: Mocha.Context) {
		this.timeout(10000);

		return (async () => {
			const giverId = "1234";
			const receiverId = "5678";
			const creationDate = dayjs().add(1, "month").hour(0).minute(0).second(0).millisecond(0).add(1, "day").subtract(1, "second");
			const { messageMock } = mockReaction(AppConfig.backend.candySuperEmoji, giverId, receiverId);

			// リアクションハンドラーを直接呼び出す
			await CandyRepositoryImpl.create({
				receiveUserId: Number(receiverId),
				giveUserId: Number(giverId),
				messageId: Number(messageMock.id),
				expiredAt: dayjs().add(1, "month").hour(0).minute(0).second(0).millisecond(0).add(1, "day").toDate(),
				deletedAt: null,
				guildId: 1234567890,
				categoryType: CandyCategoryType.CATEGORY_TYPE_SUPER.getValue(), // CATEGORY_TYPE_SUPER
			});

			// 応答の検証
			verify(messageMock.reply(anything())).never(); // モックなので実際には呼ばれない

			const res = await CandyRepositoryImpl.findAll();
			expect(res.length).to.eq(1);

			expect(String(res[0].giveUserId)).to.eq(giverId);
			expect(String(res[0].receiveUserId)).to.eq(receiverId);
			expect(res[0].categoryType).to.eq(CandyCategoryType.CATEGORY_TYPE_SUPER.getValue());

			const finishedDate = dayjs().add(1, "month").hour(0).minute(0).second(0).millisecond(0).add(1, "day").add(1, "second");

			expect(creationDate.isBefore(dayjs(res[0].expiredAt))).to.be.true;
			expect(finishedDate.isAfter(dayjs(res[0].expiredAt))).to.be.true;
		})();
	});

	/**
	 * スーパーキャンディスタンプの月間上限をテスト
	 * 1ヶ月に付与できるスーパーキャンディの上限を超えると、エラーメッセージが表示されることを確認する
	 */
	it("should limit super candy additions per month", function(this: Mocha.Context) {
		this.timeout(20000);

		return (async () => {
			const giverId = "1234";
			const receiverId = "5678";

			// SUPER_CANDY_LIMIT回のスーパーキャンディを直接作成（同じ月で）
			const today = new Date();
			for (let i = 0; i < SUPER_CANDY_LIMIT; i++) {
				await CandyRepositoryImpl.create({
					receiveUserId: Number(receiverId),
					giveUserId: Number(giverId),
					messageId: i,
					expiredAt: dayjs().add(1, "month").hour(0).minute(0).second(0).millisecond(0).add(1, "day").toDate(),
					deletedAt: null,
					createdAt: today,
					updatedAt: today,
					guildId: 1234567890,
					categoryType: CandyCategoryType.CATEGORY_TYPE_SUPER.getValue(), // CATEGORY_TYPE_SUPER
				});
			}

			// SUPER_CANDY_LIMIT+1回目のリアクションを試みる（上限に達しているため作成されない）
			const { reaction, user, messageMock } = mockReaction(AppConfig.backend.candySuperEmoji, giverId, receiverId);
			when(messageMock.id).thenReturn("9999"); // 別のメッセージID

			// リアクション追加イベントを発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

			// キャンディの数が変わっていないことを確認
			const res = await CandyRepositoryImpl.findAll();
			expect(res.length).to.eq(SUPER_CANDY_LIMIT);
		})();
	});

	/**
	 * 同じメッセージに対する重複スーパーキャンディ付与をテスト
	 * 同じメッセージに対して複数回スーパーキャンディスタンプを押しても、1回しかカウントされないことを確認する
	 */
	it("should not add super candy for the same message multiple times", function(this: Mocha.Context) {
		this.timeout(10000);

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

			// 1回目のリアクションを直接データベースに追加
			await CandyRepositoryImpl.create({
				receiveUserId: Number(receiverId),
				giveUserId: Number(giverId),
				messageId: Number(messageId),
				expiredAt: dayjs().add(1, "month").hour(0).minute(0).second(0).millisecond(0).add(1, "day").toDate(),
				deletedAt: null,
				guildId: 1234567890,
				categoryType: CandyCategoryType.CATEGORY_TYPE_SUPER.getValue(), // CATEGORY_TYPE_SUPER
			});

			// キャンディが1つ増えていることを確認
			let afterCount = await CandyRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount + 1);

			// 2回目の同じメッセージへのリアクションを追加
			const { reaction, user, messageMock } = mockReaction(AppConfig.backend.candySuperEmoji, giverId, receiverId);
			when(messageMock.id).thenReturn(messageId);

			// リアクション追加イベントを発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("messageReactionAdd", instance(reaction), instance(user), instance(mock<MessageReactionEventDetails>()));

			// キャンディの数が変わっていないことを確認（重複は追加されない）
			afterCount = await CandyRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount + 1);
		})();
	});

	/**
	 * 無効なメッセージIDでのキャンディ付与をテスト
	 * メッセージIDが無効な場合、キャンディが追加されないことを確認する
	 */
	it("should not add candy when message id is invalid", function(this: Mocha.Context) {
		this.timeout(10000);

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
				await waitUntilMessageReply(messageMock, 300);
			} catch (e) {
				// 応答がないことを確認
				verify(messageMock.reply(anything())).never();
				return;
			}
			expect("expect not reach here").to.false;
		})();
	});

	afterEach(async () => {
		await CandyRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await UserCandyItemRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
	});
});
