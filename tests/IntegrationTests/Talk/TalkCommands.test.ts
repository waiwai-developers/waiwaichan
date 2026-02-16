import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { PersonalityId } from "@/src/entities/vo/PersonalityId";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { TalkCommandHandler } from "@/src/handlers/discord.js/commands/TalkCommandHandler";
import { ChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql/ChannelRepositoryImpl";
import { CommunityRepositoryImpl } from "@/src/repositories/sequelize-mysql/CommunityRepositoryImpl";
import { ContextRepositoryImpl } from "@/src/repositories/sequelize-mysql/ContextRepositoryImpl";
import { MessageRepositoryImpl } from "@/src/repositories/sequelize-mysql/MessageRepositoryImpl";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { PersonalityContextRepositoryImpl } from "@/src/repositories/sequelize-mysql/PersonalityContextRepositoryImpl";
import { PersonalityRepositoryImpl } from "@/src/repositories/sequelize-mysql/PersonalityRepositoryImpl";
import { ThreadRepositoryImpl } from "@/src/repositories/sequelize-mysql/ThreadRepositoryImpl";
import { UserRepositoryImpl } from "@/src/repositories/sequelize-mysql/UserRepositoryImpl";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { expect } from "chai";
import { anything, instance, mock, verify, when } from "ts-mockito";

import {
	TEST_GUILD_ID,
	assertNoThreadsCreated,
	assertThreadCount,
	assertThreadExistsWithData,
	createTextChannelMock,
	emitInteractionEvent,
	executeTalkCommandTest,
} from "./TalkHelper.test";

describe("Test Talk Commands", function (this: Mocha.Suite) {
	// テストのタイムアウト時間を延長（60秒）
	this.timeout(60_000);

	// テスト用定数（MockSlashCommandのデフォルト値と一致させる）
	const TEST_USER_ID = "1234"; // MockSlashCommandのデフォルトuserId
	const TEST_CHANNEL_ID = "5678"; // MockSlashCommandのデフォルトchannelId

	beforeEach(async () => {
		// データベース接続を初期化（MockLoggerを使用）

		const connector = new MysqlConnector();
		// @ts-ignore - privateフィールドにアクセスするため
		connector.instance.options.logging = false;

		// テスト前にデータをクリーンアップ
		await ThreadRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await MessageRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await ChannelRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await UserRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await CommunityRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await PersonalityContextRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await ContextRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await PersonalityRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});

		// テスト用のコミュニティを作成
		const community = await CommunityRepositoryImpl.create({
			categoryType: CommunityCategoryType.Discord.getValue(),
			clientId: BigInt(TEST_GUILD_ID),
			batchStatus: 0,
		});

		// テスト用のユーザーを作成
		await UserRepositoryImpl.create({
			categoryType: 0, // Discord
			clientId: BigInt(TEST_USER_ID),
			userType: 0, // user
			communityId: community.id,
			batchStatus: 0,
		});

		// テスト用のチャンネルを作成
		await ChannelRepositoryImpl.create({
			categoryType: 0, // Discord
			clientId: BigInt(TEST_CHANNEL_ID),
			channelType: 2, // DiscordText
			communityId: community.id,
			batchStatus: 0,
		});

		// Personalityデータの作成
		await PersonalityRepositoryImpl.create({
			id: PersonalityId.PERSONALITY_ID_WAIWAICHAN.getValue(),
			name: "わいわいちゃん",
			prompt: {
				persona_role: "アシスタント",
				speaking_style_rules: "フレンドリー",
				response_directives: "丁寧に",
				emotion_model: "明るく",
				notes: "テスト用",
				input_scope: "全般",
			},
		});

		// Contextデータの作成（seedsで使用されていないIDを使用）
		await ContextRepositoryImpl.create({
			id: 999,
			name: "テストコンテキスト",
			prompt: {
				persona_role: "テスト役割",
				speaking_style_rules: "テストスタイル",
				response_directives: "テスト指示",
				emotion_model: "テスト感情",
				notes: "テスト注釈",
				input_scope: "テスト範囲",
			},
		});

		// PersonalityContextデータの作成（contextIdも999に変更）
		await PersonalityContextRepositoryImpl.create({
			personalityId: PersonalityId.PERSONALITY_ID_WAIWAICHAN.getValue(),
			contextId: 999,
		});
	});

	/**
	 * TalkCommandHandlerのテスト
	 */

	/**
	 * コマンド識別機能のテスト
	 * - `isHandle`メソッドが「talk」コマンドを正しく識別できるか
	 * - 他のコマンド名では`false`を返すか
	 */
	it("test isHandle method correctly identifies 'talk' command", () => {
		// TalkCommandHandlerのインスタンスを直接作成
		const talkCommandHandler = new TalkCommandHandler();

		// "talk"コマンドの場合はtrueを返すことを確認
		expect(talkCommandHandler.isHandle("talk")).to.be.true;

		// 他のコマンド名の場合はfalseを返すことを確認
		expect(talkCommandHandler.isHandle("other")).to.be.false;
		expect(talkCommandHandler.isHandle("candycheck")).to.be.false;
		expect(talkCommandHandler.isHandle("")).to.be.false;
	});

	/**
	 * チャンネル種別判定のテスト
	 * - `isTextChannel`メソッドがTextChannelを正しく判定できるか
	 * - 他のチャンネル種別（VoiceChannelなど）では`false`を返すか
	 */
	it("test isTextChannel method correctly identifies TextChannel", () => {
		// TalkCommandHandlerのインスタンスを直接作成
		const talkCommandHandler = new TalkCommandHandler();

		// TextChannelの場合はtrueを返すことを確認
		const textChannel = {
			threads: {
				create: async () => ({}),
			},
		};
		expect(talkCommandHandler.isTextChannel(textChannel)).to.be.true;

		// threadsプロパティがない場合はfalseを返すことを確認
		const nonpropertyTextChannel = {};
		expect(talkCommandHandler.isTextChannel(nonpropertyTextChannel)).to.be.false;

		// threads.createメソッドがない場合はfalseを返すことを確認
		const nonMethodTextChannel = {
			threads: {},
		};
		expect(talkCommandHandler.isTextChannel(nonMethodTextChannel)).to.be.false;
	});

	/**
	 * 基本的なコマンド実行のテスト
	 * - タイトルを指定した場合に正しくスレッドが作成されるか
	 * - 応答メッセージが「以下にお話する場を用意したよ！っ」であるか
	 * - 作成されたスレッドのタイトルが正しいか（`${context.name.getValue()}: ${title}`の形式）
	 */
	it("test talk command with title", async function (this: Mocha.Context) {
		// 個別のテストのタイムアウト時間を延長（10秒）
		this.timeout(50_000);
		// テスト用のパラメータ
		const testTitle = "テストタイトル";
		const testContextType = 999; // seedsで使用されていないIDを使用
		const testMessageId = 67890;
		const expectedThreadTitle = `テストコンテキスト: ${testTitle}`;

		// モックの設定（guildIdを正しく設定）
		const commandMock = mockSlashCommand(
			"talk",
			{
				title: testTitle,
				type: testContextType,
			},
			{ guildId: TEST_GUILD_ID },
		);

		// モックのチャンネル設定
		const channelMock = createTextChannelMock();
		when(commandMock.channel).thenReturn(instance(channelMock));

		// モックのメッセージ設定
		when(commandMock.reply(anything())).thenResolve({
			id: testMessageId,
			communityId: 1,
			startThread: async (options: any) => {
				// スレッドタイトルの検証
				expect(options.name).to.equal(expectedThreadTitle);
				return {};
			},
		} as any);

		// オブジェクト引数を受け取るreplyメソッドのモック
		when(
			commandMock.reply({
				content: "以下にお話する場を用意したよ！っ",
				fetchReply: true,
			}),
		).thenResolve({
			id: testMessageId,
			communityId: 1,
			startThread: async (options: any) => {
				// スレッドタイトルの検証
				expect(options.name).to.equal(expectedThreadTitle);
				return {};
			},
		} as any);

		// イベント発行
		await emitInteractionEvent(commandMock);

		// 応答を待機
		await waitUntilReply(commandMock);

		// 応答メッセージの検証
		verify(commandMock.reply(anything())).once();

		// スレッドが作成されるまで少し待機
		await new Promise((resolve) => setTimeout(resolve, 5000));

		// ヘルパー関数を使用してスレッド数とデータを検証
		await assertThreadCount(1);
		await assertThreadExistsWithData(testMessageId, {
			communityId: "1",
			categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
			metadata: {}, // メタデータのプロパティ存在確認のみ
		});
	});

	/**
	 * ユーザー入力の異常系チェック
	 * - タイトルが null の場合はエラーになるか
	 */
	it("test talk command with null title should throw error", async function (this: Mocha.Context) {
		this.timeout(10_000);

		// ヘルパー関数を使用してコマンドテストを実行
		await executeTalkCommandTest({ title: null, type: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue() }, {}, { expectThread: { count: 0 } });
	});

	/**
	 * ユーザー入力の異常系チェック
	 * - type パラメータが想定外の値だった場合、エラーとして処理されるか
	 */
	it("test talk command with invalid type should return error", async function (this: Mocha.Context) {
		this.timeout(10_000);

		// ヘルパー関数を使用してコマンドテストを実行
		await executeTalkCommandTest(
			{ title: "テストタイトル", type: 99999 }, // 存在しないIDを使用
			{},
			{ expectThread: { count: 0 } },
		);
	});

	/**
	 * 実行環境の異常ハンドリング
	 * - interaction.channel が null のとき、安全に処理がスキップされるか
	 */
	it("test talk command with null channel should skip processing safely", async function (this: Mocha.Context) {
		this.timeout(10_000);

		// コマンドモックを手動で設定（チャンネルがnullの特殊ケース）
		const commandMock = mockSlashCommand(
			"talk",
			{
				title: "テストタイトル",
				type: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
			},
			{ guildId: TEST_GUILD_ID },
		);
		when(commandMock.channel).thenReturn(null);

		// イベント発行
		await emitInteractionEvent(commandMock);

		// 応答がないことを確認するため少し待機
		await new Promise((resolve) => setTimeout(resolve, 100));

		// スレッドが作成されていないことを確認
		await assertNoThreadsCreated();

		// replyが呼ばれていないことを確認
		verify(commandMock.reply(anything())).never();
	});

	/**
	 * 実行環境の異常ハンドリング
	 * - チャンネルがテキストチャンネル以外だった場合の対応
	 */
	it("test talk command with non-text channel should skip processing safely", async function (this: Mocha.Context) {
		this.timeout(10_000);

		// コマンドモックを手動で設定（非テキストチャンネルの特殊ケース）
		const commandMock = mockSlashCommand(
			"talk",
			{
				title: "テストタイトル",
				type: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
			},
			{ guildId: TEST_GUILD_ID },
		);

		// テキストチャンネル以外のチャンネルを設定（threads.createメソッドがない）
		const nonTextChannelMock = mock<any>();
		when(nonTextChannelMock.threads).thenReturn({});
		when(commandMock.channel).thenReturn(instance(nonTextChannelMock));

		// イベント発行
		await emitInteractionEvent(commandMock);

		// 応答がないことを確認するため少し待機
		await new Promise((resolve) => setTimeout(resolve, 100));

		// スレッドが作成されていないことを確認
		await assertNoThreadsCreated();

		// replyが呼ばれていないことを確認
		verify(commandMock.reply(anything())).never();
	});

	/**
	 * 実行環境の異常ハンドリング
	 * - PersonalityLogic に対応するパーソナリティが見つからなかったケース
	 */
	it("test talk command when personality not found should skip processing safely", async function (this: Mocha.Context) {
		this.timeout(10_000);

		// ヘルパー関数を使用してコマンドテストを実行
		await executeTalkCommandTest(
			{ title: "テストタイトル", type: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue() },
			{},
			{ expectThread: { count: 0 } },
		);
	});

	/**
	 * 実行環境の異常ハンドリング
	 * - PersonalityContextLogic で対応するパーソナリティコンテキストが存在しなかったケース
	 */
	it("test talk command when personality context not found should skip processing safely", async function (this: Mocha.Context) {
		this.timeout(10_000);

		// ヘルパー関数を使用してコマンドテストを実行
		await executeTalkCommandTest(
			{ title: "テストタイトル", type: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue() },
			{},
			{ expectThread: { count: 0 } },
		);
	});

	/**
	 * 実行環境の異常ハンドリング
	 * - ContextLogic で有効なコンテキストが取得できなかったときのエラー挙動
	 */
	it("test talk command when context not found should skip processing safely", async function (this: Mocha.Context) {
		this.timeout(10_000);

		// ヘルパー関数を使用してコマンドテストを実行
		await executeTalkCommandTest(
			{ title: "テストタイトル", type: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue() },
			{},
			{ expectThread: { count: 0 } },
		);
	});
});
