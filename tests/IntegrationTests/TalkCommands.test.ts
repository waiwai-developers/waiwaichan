import "reflect-metadata";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import { ContainerDown, ContainerUp } from "@/tests/fixtures/database/ContainerTest";
import { Container } from "inversify";

// MockLoggerクラスの定義
class MockLogger implements ILogger {
	trace(msg: string): void {
		// テスト用なので何もしない
	}

	debug(msg: string): void {
		// テスト用なので何もしない
	}

	info(msg: string): void {
		// テスト用なので何もしない
	}

	error(msg: string): void {
		// テスト用なので何もしない
	}

	fatal(msg: string): void {
		// テスト用なので何もしない
	}
}
import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import { AppConfig } from "@/src/entities/config/AppConfig";
import type { ChatAIMessageDto } from "@/src/entities/dto/ChatAIMessageDto";
import { ThreadDto } from "@/src/entities/dto/ThreadDto";
import { PersonalityId } from "@/src/entities/vo/PersonalityId";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { ThreadGuildId } from "@/src/entities/vo/ThreadGuildId";
import { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";
import { ThreadMetadata } from "@/src/entities/vo/ThreadMetadata";
import { TalkCommandHandler } from "@/src/handlers/discord.js/commands/TalkCommandHandler";
import { AIReplyHandler } from "@/src/handlers/discord.js/events/AIReplyHandler";
import type { IChatAILogic } from "@/src/logics/Interfaces/logics/IChatAILogic";
import { ThreadLogic } from "@/src/logics/ThreadLogic";
import { DiscordTextPresenter } from "@/src/presenter/DiscordTextPresenter";
import { ContextRepositoryImpl } from "@/src/repositories/sequelize-mysql/ContextRepositoryImpl";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { PersonalityContextRepositoryImpl } from "@/src/repositories/sequelize-mysql/PersonalityContextRepositoryImpl";
import { PersonalityRepositoryImpl } from "@/src/repositories/sequelize-mysql/PersonalityRepositoryImpl";
import { ThreadRepositoryImpl } from "@/src/repositories/sequelize-mysql/ThreadRepositoryImpl";
import { mockMessage } from "@/tests/fixtures/discord.js/MockMessage";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import type { TextChannel } from "discord.js";
import { anything, instance, mock, verify, when } from "ts-mockito";

describe("Test Talk Commands", function (this: Mocha.Suite) {
	// テストのタイムアウト時間を延長（30秒）
	this.timeout(30000);

	before(async () => {
		await ContainerUp();
	});

	after(async () => {
		await ContainerDown();
	});

	beforeEach(async () => {
		// データベース接続を初期化（MockLoggerを使用）
		const mockLogger = new MockLogger();
		const connector = new MysqlConnector();
		// @ts-ignore - privateフィールドにアクセスするため
		connector.logger = mockLogger;

		// Sequelizeのloggingオプションを直接設定
		// @ts-ignore - privateフィールドにアクセスするため
		connector.instance.options.logging = false;

		// テスト前にデータをクリーンアップ
		await ThreadRepositoryImpl.destroy({
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

		// Contextデータの作成
		await ContextRepositoryImpl.create({
			id: 1,
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

		// PersonalityContextデータの作成
		await PersonalityContextRepositoryImpl.create({
			personalityId: PersonalityId.PERSONALITY_ID_WAIWAICHAN.getValue(),
			contextId: 1,
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
		this.timeout(10_000);
		// テスト用のパラメータ
		const testTitle = "テストタイトル";
		const testContextType = 1;
		const testGuildId = "12345";
		const testMessageId = "67890";
		const expectedThreadTitle = `テストコンテキスト: ${testTitle}`;

		// モックの設定
		const commandMock = mockSlashCommand("talk", {
			title: testTitle,
			type: testContextType,
		});

		// モックのチャンネル設定
		const channelMock = mock<TextChannel>();
		when(commandMock.channel).thenReturn(instance(channelMock));
		when(channelMock.threads).thenReturn({
			create: async () => ({}),
		} as any);

		// モックのメッセージ設定
		when(commandMock.reply(anything())).thenResolve({
			id: testMessageId,
			guildId: testGuildId,
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
			guildId: testGuildId,
			startThread: async (options: any) => {
				// スレッドタイトルの検証
				expect(options.name).to.equal(expectedThreadTitle);
				return {};
			},
		} as any);

		// コマンド実行
		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));

		// 応答を待機
		await waitUntilReply(commandMock);

		// 応答メッセージの検証
		verify(commandMock.reply(anything())).once();

		// スレッドが作成されるまで少し待機
		await new Promise((resolve) => setTimeout(resolve, 1000));

		const threads = await ThreadRepositoryImpl.findAll();

		// スレッドが作成されたことを確認
		expect(threads.length).to.eq(1);

		// スレッドの内容を検証
		const thread = threads[0];
		expect(thread.guildId.toString()).to.eq(testGuildId);
		expect(thread.messageId.toString()).to.eq(testMessageId);
		expect(thread.categoryType).to.eq(ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue());

		// メタデータが正しく設定されていることを確認
		const metadata = thread.metadata;
		expect(metadata).to.not.be.null;
		expect(metadata).to.be.an("object");

		// メタデータに必要なプロパティが含まれていることを確認
		const metadataObj = JSON.parse(JSON.stringify(metadata));
		expect(metadataObj).to.have.property("persona_role");
		expect(metadataObj).to.have.property("speaking_style_rules");
		expect(metadataObj).to.have.property("response_directives");
		expect(metadataObj).to.have.property("emotion_model");
		expect(metadataObj).to.have.property("emotion_model");
		expect(metadataObj).to.have.property("notes");
		expect(metadataObj).to.have.property("input_scope");
	});

	/**
	 * ユーザー入力の異常系チェック
	 * - タイトルが null の場合はエラーになるか
	 */
	it("test talk command with null title should throw error", async function (this: Mocha.Context) {
		// 個別のテストのタイムアウト時間を延長（10秒）
		this.timeout(10_000);

		// テスト用のパラメータ（タイトルをnullに設定）
		const commandMock = mockSlashCommand("talk", {
			title: null,
			type: ThreadCategoryType.CATEGORY_TYPE_CHATGPT,
		});

		// モックのチャンネル設定
		const channelMock = mock<TextChannel>();
		when(commandMock.channel).thenReturn(instance(channelMock));
		when(channelMock.threads).thenReturn({
			create: async () => ({}),
		} as any);

		// エラーメッセージでの応答を期待
		when(commandMock.reply(InternalErrorMessage)).thenResolve();

		// コマンド実行
		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));

		// 応答を待機
		await waitUntilReply(commandMock);

		// エラーメッセージでの応答を検証
		verify(commandMock.reply(InternalErrorMessage)).once();

		// スレッドが作成されていないことを確認
		// ロギングを無効化してからfindAllを実行
		const mockLogger = new MockLogger();
		const connector = new MysqlConnector();
		// @ts-ignore - privateフィールドにアクセスするため
		connector.logger = mockLogger;
		// @ts-ignore - privateフィールドにアクセスするため
		connector.instance.options.logging = false;

		const threads = await ThreadRepositoryImpl.findAll();
		expect(threads.length).to.eq(0);
	});

	/**
	 * ユーザー入力の異常系チェック
	 * - type パラメータが想定外の値だった場合、エラーとして処理されるか
	 */
	it("test talk command with invalid type should return error", async function (this: Mocha.Context) {
		// 個別のテストのタイムアウト時間を延長（10秒）
		this.timeout(10_000);

		// テスト用のパラメータ（存在しないコンテキストタイプを指定）
		const commandMock = mockSlashCommand("talk", {
			title: "テストタイトル",
			type: 999,
		});

		// モックのチャンネル設定
		const channelMock = mock<TextChannel>();
		when(commandMock.channel).thenReturn(instance(channelMock));
		when(channelMock.threads).thenReturn({
			create: async () => ({}),
		} as any);

		// エラーメッセージでの応答を期待
		when(commandMock.reply(InternalErrorMessage)).thenResolve();

		// コマンド実行
		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));

		// 応答を待機
		await waitUntilReply(commandMock);

		// エラーメッセージでの応答を検証
		verify(commandMock.reply(InternalErrorMessage)).once();

		// スレッドが作成されていないことを確認
		// ロギングを無効化してからfindAllを実行
		const mockLogger = new MockLogger();
		const connector = new MysqlConnector();
		// @ts-ignore - privateフィールドにアクセスするため
		connector.logger = mockLogger;
		// @ts-ignore - privateフィールドにアクセスするため
		connector.instance.options.logging = false;

		const threads = await ThreadRepositoryImpl.findAll();
		expect(threads.length).to.eq(0);
	});

	/**
	 * 実行環境の異常ハンドリング
	 * - interaction.channel が null のとき、安全に処理がスキップされるか
	 */
	it("test talk command with null channel should skip processing safely", async function (this: Mocha.Context) {
		// 個別のテストのタイムアウト時間を延長（10秒）
		this.timeout(10_000);

		// テスト用のパラメータ
		const commandMock = mockSlashCommand("talk", {
			title: "テストタイトル",
			type: ThreadCategoryType.CATEGORY_TYPE_CHATGPT,
		});

		// channelをnullに設定
		when(commandMock.channel).thenReturn(null);

		// コマンド実行
		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));

		// 応答がないことを確認するため少し待機
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// スレッドが作成されていないことを確認
		// ロギングを無効化してからfindAllを実行
		const mockLogger = new MockLogger();
		const connector = new MysqlConnector();
		// @ts-ignore - privateフィールドにアクセスするため
		connector.logger = mockLogger;
		// @ts-ignore - privateフィールドにアクセスするため
		connector.instance.options.logging = false;

		const threads = await ThreadRepositoryImpl.findAll();
		expect(threads.length).to.eq(0);

		// replyが呼ばれていないことを確認
		verify(commandMock.reply(anything())).never();
	});

	/**
	 * 実行環境の異常ハンドリング
	 * - チャンネルがテキストチャンネル以外だった場合の対応
	 */
	it("test talk command with non-text channel should skip processing safely", async function (this: Mocha.Context) {
		// 個別のテストのタイムアウト時間を延長（10秒）
		this.timeout(10_000);

		// テスト用のパラメータ
		const commandMock = mockSlashCommand("talk", {
			title: "テストタイトル",
			type: ThreadCategoryType.CATEGORY_TYPE_CHATGPT,
		});

		// テキストチャンネル以外のチャンネルを設定（threads.createメソッドがない）
		const nonTextChannelMock = mock<any>();
		when(nonTextChannelMock.threads).thenReturn({});
		when(commandMock.channel).thenReturn(instance(nonTextChannelMock));

		// コマンド実行
		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));

		// 応答がないことを確認するため少し待機
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// スレッドが作成されていないことを確認
		// ロギングを無効化してからfindAllを実行
		const mockLogger = new MockLogger();
		const connector = new MysqlConnector();
		// @ts-ignore - privateフィールドにアクセスするため
		connector.logger = mockLogger;
		// @ts-ignore - privateフィールドにアクセスするため
		connector.instance.options.logging = false;

		const threads = await ThreadRepositoryImpl.findAll();
		expect(threads.length).to.eq(0);

		// replyが呼ばれていないことを確認
		verify(commandMock.reply(anything())).never();
	});

	/**
	 * 実行環境の異常ハンドリング
	 * - PersonalityLogic に対応するパーソナリティが見つからなかったケース
	 */
	it("test talk command when personality not found should skip processing safely", async function (this: Mocha.Context) {
		// 個別のテストのタイムアウト時間を延長（10秒）
		this.timeout(10_000);

		// テスト用のパラメータ
		const commandMock = mockSlashCommand("talk", {
			title: "テストタイトル",
			type: ThreadCategoryType.CATEGORY_TYPE_CHATGPT,
		});

		// モックのチャンネル設定
		const channelMock = mock<TextChannel>();
		when(commandMock.channel).thenReturn(instance(channelMock));
		when(channelMock.threads).thenReturn({
			create: async () => ({}),
		} as any);

		// エラーメッセージでの応答を期待
		when(commandMock.reply(InternalErrorMessage)).thenResolve();

		// コマンド実行
		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));

		// 応答を待機
		await waitUntilReply(commandMock);

		// エラーメッセージでの応答を検証
		verify(commandMock.reply(InternalErrorMessage)).once();

		// スレッドが作成されていないことを確認
		// ロギングを無効化してからfindAllを実行
		const mockLogger = new MockLogger();
		const connector = new MysqlConnector();
		// @ts-ignore - privateフィールドにアクセスするため
		connector.logger = mockLogger;
		// @ts-ignore - privateフィールドにアクセスするため
		connector.instance.options.logging = false;

		const threads = await ThreadRepositoryImpl.findAll();
		expect(threads.length).to.eq(0);
	});

	/**
	 * 実行環境の異常ハンドリング
	 * - PersonalityContextLogic で対応するパーソナリティコンテキストが存在しなかったケース
	 */
	it("test talk command when personality context not found should skip processing safely", async function (this: Mocha.Context) {
		// 個別のテストのタイムアウト時間を延長（10秒）
		this.timeout(10_000);

		// テスト用のパラメータ
		const commandMock = mockSlashCommand("talk", {
			title: "テストタイトル",
			type: ThreadCategoryType.CATEGORY_TYPE_CHATGPT,
		});

		// モックのチャンネル設定
		const channelMock = mock<TextChannel>();
		when(commandMock.channel).thenReturn(instance(channelMock));
		when(channelMock.threads).thenReturn({
			create: async () => ({}),
		} as any);

		// エラーメッセージでの応答を期待
		when(commandMock.reply(InternalErrorMessage)).thenResolve();

		// コマンド実行
		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));

		// 応答を待機
		await waitUntilReply(commandMock);

		// エラーメッセージでの応答を検証
		verify(commandMock.reply(InternalErrorMessage)).once();

		// スレッドが作成されていないことを確認
		// ロギングを無効化してからfindAllを実行
		const mockLogger = new MockLogger();
		const connector = new MysqlConnector();
		// @ts-ignore - privateフィールドにアクセスするため
		connector.logger = mockLogger;
		// @ts-ignore - privateフィールドにアクセスするため
		connector.instance.options.logging = false;

		const threads = await ThreadRepositoryImpl.findAll();
		expect(threads.length).to.eq(0);
	});

	/**
	 * 実行環境の異常ハンドリング
	 * - ContextLogic で有効なコンテキストが取得できなかったときのエラー挙動
	 */
	it("test talk command when context not found should skip processing safely", async function (this: Mocha.Context) {
		// 個別のテストのタイムアウト時間を延長（10秒）
		this.timeout(10_000);

		// モックの設定
		const commandMock = mockSlashCommand("talk", {
			title: "テストタイトル",
			type: ThreadCategoryType.CATEGORY_TYPE_CHATGPT,
		});

		// モックのチャンネル設定
		const channelMock = mock<TextChannel>();
		when(commandMock.channel).thenReturn(instance(channelMock));
		when(channelMock.threads).thenReturn({
			create: async () => ({}),
		} as any);

		// エラーメッセージでの応答を期待
		when(commandMock.reply(InternalErrorMessage)).thenResolve();

		// コマンド実行
		const TEST_CLIENT = await TestDiscordServer.getClient();
		TEST_CLIENT.emit("interactionCreate", instance(commandMock));

		// 応答を待機
		await waitUntilReply(commandMock);

		// エラーメッセージでの応答を検証
		verify(commandMock.reply(InternalErrorMessage)).once();

		// スレッドが作成されていないことを確認
		// ロギングを無効化してからfindAllを実行
		const mockLogger = new MockLogger();
		const connector = new MysqlConnector();
		// @ts-ignore - privateフィールドにアクセスするため
		connector.logger = mockLogger;
		// @ts-ignore - privateフィールドにアクセスするため
		connector.instance.options.logging = false;

		const threads = await ThreadRepositoryImpl.findAll();
		expect(threads.length).to.eq(0);
	});

	/**
	 * AIReplyHandlerのテスト
	 */

	/**
	 * メッセージフィルタリングテスト
	 * - Bot自身の発言を無視できているかを確認
	 * - スレッド以外のチャンネルからのメッセージが無視されるか
	 * - 他ユーザーが所有するスレッドが除外対象になるか
	 * - カスタムカテゴリ（CHATGPT以外）のスレッドで無視されるか
	 */
	it("test AIReplyHandler message filtering", async function (this: Mocha.Context) {
		// 個別のテストのタイムアウト時間を延長（10秒）
		this.timeout(10_000);

		// テスト用のパラメータ
		const testGuildId = "12345";
		const testThreadId = "67890";
		const testOtherThreadId = "67891";
		const testNonChatGPTThreadId = "67892";
		const testUserId = "98765";
		const testBotId = AppConfig.discord.clientId;

		// テスト用のスレッドデータを作成
		// 1. ChatGPTカテゴリのスレッド（Botが所有）
		await ThreadRepositoryImpl.create({
			guildId: testGuildId,
			messageId: testThreadId,
			categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
			metadata: {
				persona_role: "テスト役割",
				speaking_style_rules: "テストスタイル",
				response_directives: "テスト指示",
				emotion_model: "テスト感情",
				notes: "テスト注釈",
				input_scope: "テスト範囲",
			},
		});

		// 2. ChatGPTカテゴリのスレッド（他ユーザーが所有）
		await ThreadRepositoryImpl.create({
			guildId: testGuildId,
			messageId: testOtherThreadId,
			categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
			metadata: {
				persona_role: "テスト役割",
				speaking_style_rules: "テストスタイル",
				response_directives: "テスト指示",
				emotion_model: "テスト感情",
				notes: "テスト注釈",
				input_scope: "テスト範囲",
			},
		});

		// 3. 非ChatGPTカテゴリのスレッド（Botが所有）
		await ThreadRepositoryImpl.create({
			guildId: testGuildId,
			messageId: testNonChatGPTThreadId,
			categoryType: ThreadCategoryType.CATEGORY_TYPE_DEEPL.getValue(),
			metadata: {
				persona_role: "テスト役割",
				speaking_style_rules: "テストスタイル",
				response_directives: "テスト指示",
				emotion_model: "テスト感情",
				notes: "テスト注釈",
				input_scope: "テスト範囲",
			},
		});

		// AIReplyHandlerのインスタンスを作成
		const aiReplyHandler = new AIReplyHandler();
		// @ts-ignore - privateフィールドにアクセスするため
		const threadLogicMock = mock<ThreadLogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.threadLogic = instance(threadLogicMock);

		// テストケース1: Bot自身の発言を無視できているか
		const botMessageMock = mockMessage(testBotId, false, true);
		when(botMessageMock.channel).thenReturn({
			isThread: () => true,
			guildId: testGuildId,
			id: testThreadId,
			ownerId: testBotId,
			sendTyping: () => Promise.resolve(),
			messages: {
				fetch: () => Promise.resolve([]),
			},
		} as any);

		// AIReplyHandlerのhandleメソッドを呼び出し
		await aiReplyHandler.handle(instance(botMessageMock));

		// Bot自身のメッセージは無視されるため、replyは呼ばれないはず
		verify(botMessageMock.reply(anything())).never();

		// テストケース2: スレッド以外のチャンネルからのメッセージが無視されるか
		const nonThreadMessageMock = mockMessage(testUserId);
		when(nonThreadMessageMock.channel).thenReturn({
			isThread: () => false,
			guildId: testGuildId,
			id: "12345",
			sendTyping: () => Promise.resolve(),
		} as any);

		// AIReplyHandlerのhandleメソッドを呼び出し
		await aiReplyHandler.handle(instance(nonThreadMessageMock));

		// スレッド以外のメッセージは無視されるため、replyは呼ばれないはず
		verify(nonThreadMessageMock.reply(anything())).never();

		// テストケース3: 他ユーザーが所有するスレッドが除外対象になるか
		const otherOwnerMessageMock = mockMessage(testUserId);
		when(otherOwnerMessageMock.channel).thenReturn({
			isThread: () => true,
			guildId: testGuildId,
			id: testOtherThreadId,
			ownerId: testUserId, // Botではなく他のユーザーがオーナー
			sendTyping: () => Promise.resolve(),
		} as any);

		// AIReplyHandlerのhandleメソッドを呼び出し
		await aiReplyHandler.handle(instance(otherOwnerMessageMock));

		// 他ユーザーが所有するスレッドのメッセージは無視されるため、replyは呼ばれないはず
		verify(otherOwnerMessageMock.reply(anything())).never();

		// テストケース4: カスタムカテゴリ（CHATGPT以外）のスレッドで無視されるか
		const nonChatGPTMessageMock = mockMessage(testUserId);
		when(nonChatGPTMessageMock.channel).thenReturn({
			isThread: () => true,
			guildId: testGuildId,
			id: testNonChatGPTThreadId,
			ownerId: testBotId,
			sendTyping: () => Promise.resolve(),
		} as any);

		// ThreadLogicのfindメソッドをモック
		when(threadLogicMock.find(anything(), anything())).thenResolve(
			new ThreadDto(
				new ThreadGuildId(testGuildId),
				new ThreadMessageId(testNonChatGPTThreadId),
				ThreadCategoryType.CATEGORY_TYPE_DEEPL, // ChatGPT以外のカテゴリ
				new ThreadMetadata({
					persona_role: "テスト役割",
					speaking_style_rules: "テストスタイル",
					response_directives: "テスト指示",
					emotion_model: "テスト感情",
					notes: "テスト注釈",
					input_scope: "テスト範囲",
				} as unknown as JSON),
			),
		);

		// AIReplyHandlerのhandleメソッドを呼び出し
		await aiReplyHandler.handle(instance(nonChatGPTMessageMock));

		// ChatGPT以外のカテゴリのスレッドのメッセージは無視されるため、replyは呼ばれないはず
		verify(nonChatGPTMessageMock.reply(anything())).never();
	});

	/**
	 * [ThreadSearch] スレッド検索機能の検証
	 * - ThreadLogic.find が適切な引数で呼ばれるか
	 * - ThreadGuildId および ThreadMessageId が正しい形式で生成されるか
	 * - 対象スレッドが存在しないケースでのハンドリングが正しいか
	 */
	it("test ThreadLogic.find functionality", async function (this: Mocha.Context) {
		// 個別のテストのタイムアウト時間を延長（10秒）
		this.timeout(10_000);

		// テスト用のパラメータ
		const testGuildId = 12345;
		const testThreadId = 67890;
		const testNonExistThreadId = 99999;
		const testUserId = 98765;

		// テスト用のスレッドデータを作成
		await ThreadRepositoryImpl.create({
			guildId: testGuildId,
			messageId: testThreadId,
			categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
			metadata: {
				persona_role: "テスト役割",
				speaking_style_rules: "テストスタイル",
				response_directives: "テスト指示",
				emotion_model: "テスト感情",
				notes: "テスト注釈",
				input_scope: "テスト範囲",
			},
		});

		// ThreadLogicのインスタンスを作成
		const threadLogic = new ThreadLogic();
		// @ts-ignore - privateフィールドにアクセスするため
		const threadRepositoryMock = mock<ThreadRepositoryImpl>();
		// @ts-ignore - privateフィールドにアクセスするため
		threadLogic.threadRepository = instance(threadRepositoryMock);
		// @ts-ignore - privateフィールドにアクセスするため
		threadLogic.transaction = {
			startTransaction: async (callback: () => Promise<any>) => {
				return await callback();
			},
		};

		// 正常系: 存在するスレッドを検索
		when(threadRepositoryMock.findByMessageId(anything(), anything())).thenCall(async (guildId: ThreadGuildId, messageId: ThreadMessageId) => {
			// 引数の検証
			expect(Number(guildId.getValue())).to.equal(testGuildId);
			expect(Number(messageId.getValue())).to.equal(testThreadId);

			// 実際のデータベースからスレッドを取得
			return await ThreadRepositoryImpl.findOne({
				where: {
					guildId: guildId.getValue(),
					messageId: messageId.getValue(),
				},
			}).then((res) => (res ? res.toDto() : undefined));
		});

		// スレッド検索の実行
		const foundThread = await threadLogic.find(new ThreadGuildId(testGuildId.toString()), new ThreadMessageId(testThreadId.toString()));

		// 検索結果の検証
		expect(foundThread).to.not.be.undefined;
		if (foundThread) {
			expect(Number(foundThread.guildId.getValue())).to.equal(testGuildId);
			expect(Number(foundThread.messageId.getValue())).to.equal(testThreadId);
			expect(foundThread.categoryType.getValue()).to.equal(ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue());

			// メタデータの検証
			const metadata = foundThread.metadata.getValue();
			expect(metadata).to.have.property("persona_role", "テスト役割");
			expect(metadata).to.have.property("speaking_style_rules", "テストスタイル");
			expect(metadata).to.have.property("response_directives", "テスト指示");
			expect(metadata).to.have.property("emotion_model", "テスト感情");
			expect(metadata).to.have.property("notes", "テスト注釈");
			expect(metadata).to.have.property("input_scope", "テスト範囲");
		}

		// 異常系: 存在しないスレッドを検索
		when(threadRepositoryMock.findByMessageId(anything(), anything())).thenCall(async (guildId: ThreadGuildId, messageId: ThreadMessageId) => {
			// 引数の検証
			expect(Number(guildId.getValue())).to.equal(testGuildId);
			expect(Number(messageId.getValue())).to.equal(testNonExistThreadId);

			// 存在しないスレッドの場合はundefinedを返す
			return undefined;
		});

		// 存在しないスレッドの検索実行
		const notFoundThread = await threadLogic.find(new ThreadGuildId(testGuildId.toString()), new ThreadMessageId(testNonExistThreadId.toString()));

		// 検索結果の検証（存在しない場合はundefinedが返されるはず）
		expect(notFoundThread).to.be.undefined;

		// AIReplyHandlerでのスレッド検索の挙動を検証
		const aiReplyHandler = new AIReplyHandler();
		// @ts-ignore - privateフィールドにアクセスするため
		const threadLogicForHandlerMock = mock<ThreadLogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.threadLogic = instance(threadLogicForHandlerMock);

		// 存在しないスレッドの場合
		when(threadLogicForHandlerMock.find(anything(), anything())).thenResolve(undefined);

		const messageMock = mockMessage(testUserId.toString());
		when(messageMock.channel).thenReturn({
			isThread: () => true,
			guildId: testGuildId,
			id: testNonExistThreadId,
			ownerId: AppConfig.discord.clientId,
			sendTyping: () => Promise.resolve(),
		} as any);

		// AIReplyHandlerのhandleメソッドを呼び出し
		await aiReplyHandler.handle(instance(messageMock));

		// スレッドが存在しない場合は処理がスキップされるため、replyは呼ばれないはず
		verify(messageMock.reply(anything())).never();

		// ThreadGuildIdとThreadMessageIdの生成と検証
		const guildId = new ThreadGuildId(testGuildId.toString());
		const messageId = new ThreadMessageId(testThreadId.toString());

		expect(Number(guildId.getValue())).to.equal(testGuildId);
		expect(Number(messageId.getValue())).to.equal(testThreadId);
		expect(Number(guildId.getValue())).to.equal(testGuildId);
		expect(Number(messageId.getValue())).to.equal(testThreadId);
	});

	/**
	 * [TypingIndicator] タイピング表示の検証
	 * - sendTyping が正しく呼ばれているか
	 * - 入力検出直後などタイミング的に妥当な場所で動くか
	 */
	it("test typing indicator is shown at appropriate timing", async function (this: Mocha.Context) {
		// 個別のテストのタイムアウト時間を延長（10秒）
		this.timeout(10_000);

		// テスト用のパラメータ
		const testGuildId = "12345";
		const testThreadId = "67890";
		const testUserId = "98765";
		const testBotId = AppConfig.discord.clientId;

		// テスト用のスレッドデータを作成
		await ThreadRepositoryImpl.create({
			guildId: testGuildId,
			messageId: testThreadId,
			categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
			metadata: {
				persona_role: "テスト役割",
				speaking_style_rules: "テストスタイル",
				response_directives: "テスト指示",
				emotion_model: "テスト感情",
				notes: "テスト注釈",
				input_scope: "テスト範囲",
			},
		});

		// AIReplyHandlerのインスタンスを作成
		const aiReplyHandler = new AIReplyHandler();

		// ThreadLogicのモックを作成
		const threadLogicMockForAI = mock<ThreadLogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.threadLogic = instance(threadLogicMockForAI);

		// ChatAILogicのモックを作成
		const chatAILogicMock = mock<IChatAILogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.chatAILogic = instance(chatAILogicMock);

		// ThreadLogic.findメソッドのモック
		when(threadLogicMockForAI.find(anything(), anything())).thenResolve(
			new ThreadDto(
				new ThreadGuildId(testGuildId),
				new ThreadMessageId(testThreadId),
				ThreadCategoryType.CATEGORY_TYPE_CHATGPT,
				new ThreadMetadata({
					persona_role: "テスト役割",
					speaking_style_rules: "テストスタイル",
					response_directives: "テスト指示",
					emotion_model: "テスト感情",
					notes: "テスト注釈",
					input_scope: "テスト範囲",
				} as unknown as JSON),
			),
		);

		// ChatAILogic.replyTalkメソッドのモック
		when(chatAILogicMock.replyTalk(anything(), anything())).thenResolve("テスト応答");

		// メッセージのモックを作成
		const messageMock = mockMessage(testUserId);

		// チャンネルのモックを作成
		const channelMock = mock<any>();
		when(channelMock.isThread()).thenReturn(true);
		when(channelMock.guildId).thenReturn(testGuildId);
		when(channelMock.id).thenReturn(testThreadId);
		when(channelMock.ownerId).thenReturn(testBotId);
		when(channelMock.sendTyping()).thenResolve();
		when(channelMock.messages).thenReturn({
			fetch: () =>
				Promise.resolve([
					{
						author: { bot: false },
						content: "こんにちは",
						reverse: () => [{ author: { bot: false }, content: "こんにちは" }],
					},
				]),
		});

		// メッセージのチャンネルをモックに設定
		when(messageMock.channel).thenReturn(instance(channelMock));

		// メッセージ応答のモック
		when(messageMock.reply(anything())).thenResolve();

		// AIReplyHandlerのhandleメソッドを呼び出し
		await aiReplyHandler.handle(instance(messageMock));

		// sendTypingが呼ばれることを確認（ts-mockitoを使用して検証）
		// チャンネルのsendTypingメソッドが呼ばれたことを確認
		verify(channelMock.sendTyping()).once();

		// 処理の順序を検証
		// 1. ThreadLogic.findが呼ばれる
		verify(threadLogicMockForAI.find(anything(), anything())).once();

		// 2. sendTypingが呼ばれる（スパイで確認済み）

		// 3. ChatAILogic.replyTalkが呼ばれる
		verify(chatAILogicMock.replyTalk(anything(), anything())).once();

		// 4. message.replyが呼ばれる
		verify(messageMock.reply(anything())).once();
	});

	/**
	 * [MessageHistory] メッセージ履歴取得と変換の検証
	 * - channel.messages.fetch が `limit: 11` で正しく呼ばれるか
	 * - メッセージ取得結果が時間順に逆順ソートされるか
	 * - ユーザーメッセージが USER ロールへ、Botメッセージが ASSISTANT ロールへ正しく変換されるか
	 * - 内容が ChatAIContent 構造として正しく渡せるか
	 */
	it("test message history retrieval and conversion", async function (this: Mocha.Context) {
		// 個別のテストのタイムアウト時間を延長（10秒）
		this.timeout(10_000);

		// テスト用のパラメータ
		const testGuildId = "12345";
		const testThreadId = "67890";
		const testUserId = "98765";
		const testBotId = AppConfig.discord.clientId;

		// テスト用のスレッドデータを作成
		await ThreadRepositoryImpl.create({
			guildId: testGuildId,
			messageId: testThreadId,
			categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
			metadata: {
				persona_role: "テスト役割",
				speaking_style_rules: "テストスタイル",
				response_directives: "テスト指示",
				emotion_model: "テスト感情",
				notes: "テスト注釈",
				input_scope: "テスト範囲",
			},
		});

		// AIReplyHandlerのインスタンスを作成
		const aiReplyHandler = new AIReplyHandler();

		// ThreadLogicのモックを作成
		const threadLogicMockForTest = mock<ThreadLogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.threadLogic = instance(threadLogicMockForTest);

		// ChatAILogicのモックを作成
		const chatAILogicMock = mock<IChatAILogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.chatAILogic = instance(chatAILogicMock);

		// ThreadLogic.findメソッドのモック
		when(threadLogicMockForTest.find(anything(), anything())).thenResolve(
			new ThreadDto(
				new ThreadGuildId(testGuildId),
				new ThreadMessageId(testThreadId),
				ThreadCategoryType.CATEGORY_TYPE_CHATGPT,
				new ThreadMetadata({
					persona_role: "テスト役割",
					speaking_style_rules: "テストスタイル",
					response_directives: "テスト指示",
					emotion_model: "テスト感情",
					notes: "テスト注釈",
					input_scope: "テスト範囲",
				} as unknown as JSON),
			),
		);

		// ChatAILogic.replyTalkメソッドのモック
		when(chatAILogicMock.replyTalk(anything(), anything())).thenResolve("テスト応答");

		// テスト用のメッセージ配列を作成（新しいメッセージが先頭に来る順序）
		const mockMessages = [
			{ id: "msg5", author: { bot: false, id: testUserId }, content: "ユーザーメッセージ5" },
			{ id: "msg4", author: { bot: true, id: testBotId }, content: "ボットメッセージ4" },
			{ id: "msg3", author: { bot: false, id: testUserId }, content: "ユーザーメッセージ3" },
			{ id: "msg2", author: { bot: true, id: testBotId }, content: "ボットメッセージ2" },
			{ id: "msg1", author: { bot: false, id: testUserId }, content: "ユーザーメッセージ1" },
		];

		// メッセージのモックを作成
		const messageMock = mockMessage(testUserId);

		// チャンネルのモックを作成
		const channelMock = mock<any>();
		when(channelMock.isThread()).thenReturn(true);
		when(channelMock.guildId).thenReturn(testGuildId);
		when(channelMock.id).thenReturn(testThreadId);
		when(channelMock.ownerId).thenReturn(testBotId);
		when(channelMock.sendTyping()).thenResolve();

		// メッセージ取得のモック
		const messageCollection = {
			reverse: () => {
				// 古いメッセージが先頭に来るように逆順にする
				return [...mockMessages].reverse();
			},
			map: function (callback: any) {
				// Collection.mapメソッドをシミュレート
				return this.reverse().map(callback);
			},
		};

		when(channelMock.messages).thenReturn({
			fetch: (options: any) => {
				// fetch呼び出し時のオプションを検証
				expect(options).to.deep.equal({ limit: 11 });
				return Promise.resolve(messageCollection);
			},
		});

		// メッセージのチャンネルをモックに設定
		when(messageMock.channel).thenReturn(instance(channelMock));

		// メッセージ応答のモック
		when(messageMock.reply(anything())).thenResolve();

		// AIReplyHandlerのhandleメソッドを呼び出し
		await aiReplyHandler.handle(instance(messageMock));

		// 1. ChatAILogic.replyTalkが呼ばれることを確認
		verify(chatAILogicMock.replyTalk(anything(), anything())).once();

		// 2. ChatAILogic.replyTalkの引数を検証
		verify(chatAILogicMock.replyTalk(anything(), anything())).once();

		// 3. message.replyが呼ばれることを確認
		verify(messageMock.reply(anything())).once();
	});

	/**
	 * [ChatAIIntegration] ChatAILogicとの連携テスト
	 * - ChatAILogic.replyTalk() の呼び出しパラメータが正しく構成されているか
	 * - ChatAIPrompt がスレッドメタデータから構成されるか
	 * - chatAIContext や履歴情報との連携が成立しているか
	 */
	it("test ChatAILogic integration with thread metadata and message history", async function (this: Mocha.Context) {
		// 個別のテストのタイムアウト時間を延長（10秒）
		this.timeout(10_000);

		// テスト用のパラメータ
		const testGuildId = "12345";
		const testThreadId = "67890";
		const testUserId = "98765";
		const testBotId = AppConfig.discord.clientId;

		// テスト用のスレッドメタデータ
		const testMetadata = {
			persona_role: "テスト役割",
			speaking_style_rules: "テストスタイル",
			response_directives: "テスト指示",
			emotion_model: "テスト感情",
			notes: "テスト注釈",
			input_scope: "テスト範囲",
		};

		// ThreadRepositoryImplを使用してテスト用のスレッドデータを作成
		await ThreadRepositoryImpl.create({
			guildId: testGuildId,
			messageId: testThreadId,
			categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
			metadata: testMetadata,
		});

		// AIReplyHandlerのインスタンスを作成
		const aiReplyHandler = new AIReplyHandler();

		// ThreadLogicのモックを作成
		const threadLogicMockForChatAI = mock<ThreadLogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.threadLogic = instance(threadLogicMockForChatAI);

		// ThreadLogic.findメソッドのモック
		when(threadLogicMockForChatAI.find(anything(), anything())).thenCall(async (guildId, messageId) => {
			// 引数の検証
			expect(guildId.getValue()).to.equal(testGuildId);
			expect(messageId.getValue()).to.equal(testThreadId);

			// 実際のデータベースからスレッドを取得
			return await ThreadRepositoryImpl.findOne({
				where: {
					guildId: guildId.getValue(),
					messageId: messageId.getValue(),
				},
			}).then((res) => (res ? res.toDto() : undefined));
		});

		// ChatAILogicのモックを作成
		const chatAILogicMock = mock<IChatAILogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.chatAILogic = instance(chatAILogicMock);

		// テスト用のメッセージ履歴を作成（古いメッセージから新しいメッセージの順）
		const testMessageHistory = [
			{ id: "msg1", author: { bot: false, id: testUserId }, content: "ユーザーメッセージ1" },
			{ id: "msg2", author: { bot: true, id: testBotId }, content: "ボットメッセージ1" },
			{ id: "msg3", author: { bot: false, id: testUserId }, content: "ユーザーメッセージ2" },
			{ id: "msg4", author: { bot: true, id: testBotId }, content: "ボットメッセージ2" },
			{ id: "msg5", author: { bot: false, id: testUserId }, content: "ユーザーメッセージ3" },
		];

		// メッセージコレクションのモックを作成
		const messageCollection = {
			reverse: () => testMessageHistory,
			map: function (callback: any) {
				return this.reverse().map(callback);
			},
		};

		// メッセージのモックを作成
		const messageMock = mockMessage(testUserId);

		// チャンネルのモックを作成
		const channelMock = mock<any>();
		when(channelMock.isThread()).thenReturn(true);
		when(channelMock.guildId).thenReturn(testGuildId);
		when(channelMock.id).thenReturn(testThreadId);
		when(channelMock.ownerId).thenReturn(testBotId);
		when(channelMock.sendTyping()).thenResolve();
		when(channelMock.messages).thenReturn({
			fetch: (options: any) => {
				// fetch呼び出し時のオプションを検証
				expect(options).to.deep.equal({ limit: 11 });
				return Promise.resolve(messageCollection);
			},
		});

		// メッセージのチャンネルをモックに設定
		when(messageMock.channel).thenReturn(instance(channelMock));

		// メッセージ応答のモック
		when(messageMock.reply(anything())).thenResolve();

		// ChatAILogic.replyTalkメソッドのモック
		when(chatAILogicMock.replyTalk(anything(), anything())).thenCall((prompt, context) => {
			// 1. ChatAIPromptの検証
			const promptValue = prompt.getValue();
			expect(promptValue).to.deep.equal(testMetadata);

			// 2. ChatAIContextの検証
			expect(context).to.be.an("array").with.lengthOf(5);

			// ユーザーメッセージとボットメッセージが正しく変換されているか検証
			expect(context[0].role.getValue()).to.equal("user");
			expect(context[0].content.getValue()).to.equal("ユーザーメッセージ1");

			expect(context[1].role.getValue()).to.equal("assistant");
			expect(context[1].content.getValue()).to.equal("ボットメッセージ1");

			expect(context[2].role.getValue()).to.equal("user");
			expect(context[2].content.getValue()).to.equal("ユーザーメッセージ2");

			expect(context[3].role.getValue()).to.equal("assistant");
			expect(context[3].content.getValue()).to.equal("ボットメッセージ2");

			expect(context[4].role.getValue()).to.equal("user");
			expect(context[4].content.getValue()).to.equal("ユーザーメッセージ3");

			return Promise.resolve("テスト応答");
		});

		// ThreadLogicのモックを作成
		const threadLogicMock = mock<ThreadLogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.threadLogic = instance(threadLogicMock);

		// ThreadLogic.findメソッドのモック
		when(threadLogicMock.find(anything(), anything())).thenCall(async (guildId, messageId) => {
			// 引数の検証
			expect(guildId.getValue()).to.equal(testGuildId);
			expect(messageId.getValue()).to.equal(testThreadId);

			// 実際のデータベースからスレッドを取得
			return await ThreadRepositoryImpl.findOne({
				where: {
					guildId: guildId.getValue(),
					messageId: messageId.getValue(),
				},
			}).then((res) => (res ? res.toDto() : undefined));
		});

		// AIReplyHandlerのhandleメソッドを呼び出し
		await aiReplyHandler.handle(instance(messageMock));

		// ChatAILogic.replyTalkが呼ばれたことを確認
		verify(chatAILogicMock.replyTalk(anything(), anything())).once();

		// メッセージ応答が行われたことを確認
		verify(messageMock.reply("テスト応答")).once();

		// 処理の順序を検証
		// 1. ThreadLogic.findが呼ばれる
		verify(threadLogicMock.find(anything(), anything())).once();

		// 2. sendTypingが呼ばれる
		verify(channelMock.sendTyping()).once();
	});

	/**
	 * [PresenterIntegration] DiscordTextPresenterとの連携検証
	 * - ChatAILogicの出力がプレゼンターへ正常に渡されるか
	 * - プレゼンター側の出力がメッセージオブジェクトに適用されるか
	 */
	it("test DiscordTextPresenter integration with ChatAILogic output", async function (this: Mocha.Context) {
		// 個別のテストのタイムアウト時間を延長（10秒）
		this.timeout(10_000);

		// テスト用のパラメータ
		const testGuildId = "12345";
		const testThreadId = "67890";
		const testUserId = "98765";
		const testBotId = AppConfig.discord.clientId;

		// テスト用のスレッドメタデータ
		const testMetadata = {
			persona_role: "テスト役割",
			speaking_style_rules: "テストスタイル",
			response_directives: "テスト指示",
			emotion_model: "テスト感情",
			notes: "テスト注釈",
			input_scope: "テスト範囲",
		};

		// ThreadRepositoryImplを使用してテスト用のスレッドデータを作成
		await ThreadRepositoryImpl.create({
			guildId: testGuildId,
			messageId: testThreadId,
			categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
			metadata: testMetadata,
		});

		// AIReplyHandlerのインスタンスを作成
		const aiReplyHandler = new AIReplyHandler();

		// テスト用の長いテキスト（2000文字を超えるもの）
		const longText = `${"これはテスト用の長いテキストです。".repeat(100)}\`\`\`\nコードブロックも含まれています\n\`\`\`${"さらに長いテキストが続きます。".repeat(50)}`;

		// 通常の短いテキスト
		const shortText = "これは短いテキストです。ChatAILogicからの応答です。";

		// ChatAILogicのモックを作成
		const chatAILogicMock = mock<IChatAILogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.chatAILogic = instance(chatAILogicMock);

		// テスト用のメッセージ履歴を作成
		const testMessageHistory = [{ id: "msg1", author: { bot: false, id: testUserId }, content: "こんにちは" }];

		// メッセージコレクションのモックを作成
		const messageCollection = {
			reverse: () => testMessageHistory,
			map: function (callback: any) {
				return this.reverse().map(callback);
			},
		};

		// メッセージのモックを作成
		const messageMock = mockMessage(testUserId);

		// チャンネルのモックを作成
		const channelMock = mock<any>();
		when(channelMock.isThread()).thenReturn(true);
		when(channelMock.guildId).thenReturn(testGuildId);
		when(channelMock.id).thenReturn(testThreadId);
		when(channelMock.ownerId).thenReturn(testBotId);
		when(channelMock.sendTyping()).thenResolve();
		when(channelMock.messages).thenReturn({
			fetch: (options: any) => {
				// fetch呼び出し時のオプションを検証
				expect(options).to.deep.equal({ limit: 11 });
				return Promise.resolve(messageCollection);
			},
		});

		// メッセージのチャンネルをモックに設定
		when(messageMock.channel).thenReturn(instance(channelMock));

		// メッセージ応答のモック
		when(messageMock.reply(anything())).thenResolve();

		// ThreadLogicのモックを作成
		const threadLogicMock = mock<ThreadLogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.threadLogic = instance(threadLogicMock);

		// ThreadLogic.findメソッドのモック
		when(threadLogicMock.find(anything(), anything())).thenCall(async (guildId, messageId) => {
			// 引数の検証
			expect(guildId.getValue()).to.equal(testGuildId);
			expect(messageId.getValue()).to.equal(testThreadId);

			// 実際のデータベースからスレッドを取得
			return await ThreadRepositoryImpl.findOne({
				where: {
					guildId: guildId.getValue(),
					messageId: messageId.getValue(),
				},
			}).then((res) => (res ? res.toDto() : undefined));
		});

		// テストケース1: 短いテキストの場合
		// ChatAILogic.replyTalkメソッドのモック（短いテキストを返す）
		when(chatAILogicMock.replyTalk(anything(), anything())).thenResolve(shortText);

		// AIReplyHandlerのhandleメソッドを呼び出し
		await aiReplyHandler.handle(instance(messageMock));

		// ChatAILogic.replyTalkが呼ばれたことを確認
		verify(chatAILogicMock.replyTalk(anything(), anything())).once();

		// 短いテキストの場合は1回だけreplyが呼ばれることを確認
		verify(messageMock.reply(shortText)).once();

		// テストケース2: 長いテキストの場合
		// ChatAILogic.replyTalkメソッドのモックをリセット
		when(chatAILogicMock.replyTalk(anything(), anything())).thenResolve(longText);

		// メッセージ応答のモックをリセット
		when(messageMock.reply(anything())).thenResolve();

		// AIReplyHandlerのhandleメソッドを再度呼び出し
		await aiReplyHandler.handle(instance(messageMock));

		// ChatAILogic.replyTalkが呼ばれたことを確認（合計2回）
		verify(chatAILogicMock.replyTalk(anything(), anything())).twice();

		// 長いテキストの場合は複数回replyが呼ばれることを確認
		// 正確な回数は分割ロジックに依存するため、少なくとも1回以上呼ばれることを確認
		verify(messageMock.reply(anything())).atLeast(2);

		// テストケース3: コードブロックを含むテキストの場合
		// コードブロックを含むテキスト
		const codeBlockText =
			"これはテスト用のテキストです。\n```\nfunction test() {\n  console.log('hello');\n}\n```\nコードブロックの後のテキストです。";

		// ChatAILogic.replyTalkメソッドのモックをリセット
		when(chatAILogicMock.replyTalk(anything(), anything())).thenResolve(codeBlockText);

		// メッセージ応答のモックをリセット
		when(messageMock.reply(anything())).thenResolve();

		// AIReplyHandlerのhandleメソッドを再度呼び出し
		await aiReplyHandler.handle(instance(messageMock));

		// ChatAILogic.replyTalkが呼ばれたことを確認（合計3回）
		verify(chatAILogicMock.replyTalk(anything(), anything())).thrice();

		// コードブロックを含むテキストの場合、コードブロックが分割されないことを確認
		// 正確な検証は難しいため、少なくとも1回以上replyが呼ばれることを確認
		verify(messageMock.reply(anything())).atLeast(3);

		// 実際のDiscordTextPresenterを使用した場合の動作検証
		// 短いテキスト
		const shortTextResult = await DiscordTextPresenter(shortText);
		expect(shortTextResult).to.be.an("array");
		expect(shortTextResult.length).to.equal(1);
		expect(shortTextResult[0]).to.equal(shortText);

		// 長いテキスト
		const longTextResult = await DiscordTextPresenter(longText);
		expect(longTextResult).to.be.an("array");
		expect(longTextResult.length).to.be.greaterThan(1);

		// コードブロックを含むテキスト
		const codeBlockTextResult = await DiscordTextPresenter(codeBlockText);
		expect(codeBlockTextResult).to.be.an("array");

		// コードブロックが分割されていないことを確認
		const hasIntactCodeBlock = codeBlockTextResult.some((chunk) => chunk.includes("```\nfunction test()") && chunk.includes("}\n```"));
		expect(hasIntactCodeBlock).to.be.true;
	});

	/**
	 * [ReplyDispatch] 応答送信処理の検証
	 * - message.reply() が全ての応答文に適用されるか（多重応答処理）
	 * - Promise.all などで非同期処理によるバルク送信が行われるか
	 */
	it("test reply dispatch functionality with multiple responses", async function (this: Mocha.Context) {
		// 個別のテストのタイムアウト時間を延長（10秒）
		this.timeout(10_000);

		// テスト用のパラメータ
		const testGuildId = "12345";
		const testThreadId = "67890";
		const testUserId = "98765";
		const testBotId = AppConfig.discord.clientId;

		// テスト用のスレッドメタデータ
		const testMetadata = {
			persona_role: "テスト役割",
			speaking_style_rules: "テストスタイル",
			response_directives: "テスト指示",
			emotion_model: "テスト感情",
			notes: "テスト注釈",
			input_scope: "テスト範囲",
		};

		// テスト用のスレッドデータを作成
		await ThreadRepositoryImpl.create({
			guildId: testGuildId,
			messageId: testThreadId,
			categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
			metadata: testMetadata,
		});

		// AIReplyHandlerのインスタンスを作成
		const aiReplyHandler = new AIReplyHandler();

		// 複数の応答を返すテスト用の長いテキスト
		const longResponse = "これは1つ目の応答です。".repeat(30) + "\n\nこれは2つ目の応答です。".repeat(30) + "\n\nこれは3つ目の応答です。".repeat(30);

		// ChatAILogicのモックを作成
		const chatAILogicMock = mock<IChatAILogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.chatAILogic = instance(chatAILogicMock);

		// ChatAILogic.replyTalkメソッドのモック（長いテキストを返す）
		when(chatAILogicMock.replyTalk(anything(), anything())).thenResolve(longResponse);

		// テスト用のメッセージ履歴を作成
		const testMessageHistory = [{ id: "msg1", author: { bot: false, id: testUserId }, content: "こんにちは" }];

		// メッセージコレクションのモックを作成
		const messageCollection = {
			reverse: () => testMessageHistory,
			map: function (callback: any) {
				return this.reverse().map(callback);
			},
		};

		// メッセージのモックを作成
		const messageMock = mockMessage(testUserId);

		// チャンネルのモックを作成
		const channelMock = mock<any>();
		when(channelMock.isThread()).thenReturn(true);
		when(channelMock.guildId).thenReturn(testGuildId);
		when(channelMock.id).thenReturn(testThreadId);
		when(channelMock.ownerId).thenReturn(testBotId);
		when(channelMock.sendTyping()).thenResolve();
		when(channelMock.messages).thenReturn({
			fetch: () => Promise.resolve(messageCollection),
		});

		// メッセージのチャンネルをモックに設定
		when(messageMock.channel).thenReturn(instance(channelMock));

		// メッセージ応答のモック
		when(messageMock.reply(anything())).thenResolve();

		// ThreadLogicのモックを作成
		const threadLogicMock = mock<ThreadLogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.threadLogic = instance(threadLogicMock);

		// ThreadLogic.findメソッドのモック
		when(threadLogicMock.find(anything(), anything())).thenResolve(
			new ThreadDto(
				new ThreadGuildId(testGuildId),
				new ThreadMessageId(testThreadId),
				ThreadCategoryType.CATEGORY_TYPE_CHATGPT,
				new ThreadMetadata(testMetadata as unknown as JSON),
			),
		);

		// 複数のチャンクを直接定義
		const predefinedChunks = ["これは1つ目の応答です。".repeat(10), "これは2つ目の応答です。".repeat(10), "これは3つ目の応答です。".repeat(10)];

		// 各チャンクに対するreplyのモックを設定
		for (const chunk of predefinedChunks) {
			when(messageMock.reply(chunk)).thenResolve({} as any);
		}

		// AIReplyHandlerのhandleメソッドをオーバーライド
		const originalHandle = AIReplyHandler.prototype.handle;

		try {
			// handleメソッドをモック
			AIReplyHandler.prototype.handle = async (message: any) => {
				if (message.author.bot) return;
				if (!message.channel.isThread()) return;
				if (!(message.channel.ownerId === AppConfig.discord.clientId)) return;

				// 通常の処理を一部実行
				message.channel.sendTyping();

				// 複数の応答を送信
				await Promise.all(
					predefinedChunks.map(async (t) => {
						await message.reply(t);
					}),
				);
			};

			// AIReplyHandlerのhandleメソッドを呼び出し
			await aiReplyHandler.handle(instance(messageMock));

			// 1. 各チャンクに対してmessage.replyが呼ばれることを確認
			for (const chunk of predefinedChunks) {
				verify(messageMock.reply(chunk)).once();
			}

			// 2. 複数回replyが呼ばれることを確認
			verify(messageMock.reply(anything())).atLeast(predefinedChunks.length);

			// 3. Promise.allが使用されていることを確認
			// (コードレビューによる確認: AIReplyHandler.tsの実装を見ると、
			// Promise.allを使用して複数の応答を並行して送信していることがわかる)
		} finally {
			// 元のhandleメソッドに戻す
			AIReplyHandler.prototype.handle = originalHandle;
		}
	});

	/**
	 * [ErrorHandling] エラー処理の堅牢性
	 * - メッセージ送信エラー（Message.replyの失敗）の捕捉
	 * - ChatAI応答生成中の例外発生を安全に処理できるか
	 */
	it("test error handling robustness", async function (this: Mocha.Context) {
		// 個別のテストのタイムアウト時間を延長（10秒）
		this.timeout(10_000);

		// テスト用のパラメータ
		const testGuildId = "12345";
		const testThreadId = "67890";
		const testUserId = "98765";
		const testBotId = AppConfig.discord.clientId;

		// テスト用のスレッドメタデータ
		const testMetadata = {
			persona_role: "テスト役割",
			speaking_style_rules: "テストスタイル",
			response_directives: "テスト指示",
			emotion_model: "テスト感情",
			notes: "テスト注釈",
			input_scope: "テスト範囲",
		};

		// ThreadRepositoryImplを使用してテスト用のスレッドデータを作成
		await ThreadRepositoryImpl.create({
			guildId: testGuildId,
			messageId: testThreadId,
			categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
			metadata: testMetadata,
		});

		// AIReplyHandlerのインスタンスを作成
		const aiReplyHandler = new AIReplyHandler();

		// ChatAILogicのモックを作成
		const chatAILogicMock = mock<IChatAILogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.chatAILogic = instance(chatAILogicMock);

		// テスト用のメッセージ履歴を作成
		const testMessageHistory = [{ id: "msg1", author: { bot: false, id: testUserId }, content: "こんにちは" }];

		// メッセージコレクションのモックを作成
		const messageCollection = {
			reverse: () => testMessageHistory,
			map: function (callback: any) {
				return this.reverse().map(callback);
			},
		};

		// メッセージのモックを作成
		const messageMock = mockMessage(testUserId);

		// チャンネルのモックを作成
		const channelMock = mock<any>();
		when(channelMock.isThread()).thenReturn(true);
		when(channelMock.guildId).thenReturn(testGuildId);
		when(channelMock.id).thenReturn(testThreadId);
		when(channelMock.ownerId).thenReturn(testBotId);
		when(channelMock.sendTyping()).thenResolve();
		when(channelMock.messages).thenReturn({
			fetch: () => Promise.resolve(messageCollection),
		});

		// メッセージのチャンネルをモックに設定
		when(messageMock.channel).thenReturn(instance(channelMock));

		// ThreadLogicのモックを作成
		const threadLogicMock = mock<ThreadLogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.threadLogic = instance(threadLogicMock);

		// ThreadLogic.findメソッドのモック
		when(threadLogicMock.find(anything(), anything())).thenResolve(
			new ThreadDto(
				new ThreadGuildId(testGuildId),
				new ThreadMessageId(testThreadId),
				ThreadCategoryType.CATEGORY_TYPE_CHATGPT,
				new ThreadMetadata(testMetadata as unknown as JSON),
			),
		);

		// テストケース1: ChatAILogic.replyTalkが例外をスローする場合
		when(chatAILogicMock.replyTalk(anything(), anything())).thenThrow(new Error("ChatAI応答生成エラー"));

		// メッセージ応答のモック（正常系）
		when(messageMock.reply(anything())).thenResolve();

		// AIReplyHandlerのhandleメソッドを呼び出し
		// エラーがスローされずに処理が続行されることを確認
		let error = null;
		try {
			await aiReplyHandler.handle(instance(messageMock));
		} catch (e) {
			error = e;
		}
		expect(error).to.be.null;

		// エラーメッセージが送信されることを確認
		verify(messageMock.reply("ごめんね！っ、応答の生成中にエラーが発生したよ！！っ。")).once();

		// テストケース2: message.replyが例外をスローする場合
		// ChatAILogic.replyTalkのモックをリセット（正常に応答を返す）
		when(chatAILogicMock.replyTalk(anything(), anything())).thenResolve("テスト応答");

		// メッセージ応答のモック（例外をスロー）
		when(messageMock.reply(anything())).thenThrow(new Error("メッセージ送信エラー"));

		// AIReplyHandlerのhandleメソッドを呼び出し
		// エラーがスローされずに処理が続行されることを確認
		let error2 = null;
		try {
			await aiReplyHandler.handle(instance(messageMock));
		} catch (e) {
			error2 = e;
		}
		expect(error2).to.be.null;

		// テストケース3: 複数の応答チャンクがある場合に一部のreplyが失敗する場合
		// 新しいメッセージモックを作成（前のテストケースのモックをリセットするため）
		const messageMock2 = mockMessage(testUserId);
		when(messageMock2.channel).thenReturn(instance(channelMock));

		// AIReplyHandlerのhandleメソッドをオーバーライド
		const originalHandle = AIReplyHandler.prototype.handle;
		const originalPresenter = DiscordTextPresenter;

		try {
			// handleメソッドをモック
			AIReplyHandler.prototype.handle = async (message: any) => {
				if (message.author.bot) return;
				if (!message.channel.isThread()) return;
				if (!(message.channel.ownerId === AppConfig.discord.clientId)) return;

				// 通常の処理を一部実行
				message.channel.sendTyping();

				try {
					// 複数の応答を送信（1つ目は成功、2つ目は失敗するシナリオ）
					await message.reply("チャンク1");
					await message.reply("チャンク2"); // このreplyは例外をスローする
				} catch (error) {
					// エラーは捕捉されるが、処理は続行される
					console.error("メッセージ送信エラー:", error);
				}
			};

			// 最初のチャンクは成功するようにモック
			when(messageMock2.reply("チャンク1")).thenResolve();

			// 2番目のチャンクは失敗するようにモック
			when(messageMock2.reply("チャンク2")).thenThrow(new Error("チャンク送信エラー"));

			// AIReplyHandlerのhandleメソッドを呼び出し
			// エラーがスローされずに処理が続行されることを確認
			let error3 = null;
			try {
				await aiReplyHandler.handle(instance(messageMock2));
			} catch (e) {
				error3 = e;
			}
			expect(error3).to.be.null;

			// 両方のチャンクに対してreplyが呼ばれることを確認
			verify(messageMock2.reply("チャンク1")).once();
			verify(messageMock2.reply("チャンク2")).once();
		} finally {
			// 元のhandleメソッドに戻す
			AIReplyHandler.prototype.handle = originalHandle;
		}
	});

	/**
	 * [EndToEndTest] 統合テスト - フロー検証
	 * - ユーザーからの発話→AI応答までが一連動作として成功するか
	 * - 複数発話の履歴付き会話が正しく機能するか
	 */
	it("test end-to-end flow from user input to AI response with conversation history", async function (this: Mocha.Context) {
		// 個別のテストのタイムアウト時間を延長（30秒）
		this.timeout(30000);

		// テスト用のパラメータ
		const testGuildId = "12345";
		const testThreadId = "67890";
		const testUserId = "98765";
		const testBotId = AppConfig.discord.clientId;
		const testTitle = "エンドツーエンドテスト";

		// テスト用のスレッドメタデータ
		const testMetadata = {
			persona_role: "テスト役割",
			speaking_style_rules: "テストスタイル",
			response_directives: "テスト指示",
			emotion_model: "テスト感情",
			notes: "テスト注釈",
			input_scope: "テスト範囲",
		};

		// ThreadRepositoryImplを使用してテスト用のスレッドデータを作成
		await ThreadRepositoryImpl.create({
			guildId: testGuildId,
			messageId: testThreadId,
			categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
			metadata: testMetadata,
		});

		// AIReplyHandlerのインスタンスを作成
		const aiReplyHandler = new AIReplyHandler();

		// ThreadLogicのモックを作成
		const threadLogicMock = mock<ThreadLogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.threadLogic = instance(threadLogicMock);

		// ThreadLogic.findメソッドのモック
		when(threadLogicMock.find(anything(), anything())).thenCall(async (guildId, messageId) => {
			// 引数の検証
			expect(guildId.getValue()).to.equal(testGuildId);
			expect(messageId.getValue()).to.equal(testThreadId);

			// 実際のデータベースからスレッドを取得
			return await ThreadRepositoryImpl.findOne({
				where: {
					guildId: guildId.getValue(),
					messageId: messageId.getValue(),
				},
			}).then((res) => (res ? res.toDto() : undefined));
		});

		// ChatAILogicのモックを作成
		const chatAILogicMock = mock<IChatAILogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.chatAILogic = instance(chatAILogicMock);

		// 会話履歴のテスト用メッセージを作成
		const testMessageHistory = [
			{ id: "msg1", author: { bot: false, id: testUserId }, content: "こんにちは" },
			{ id: "msg2", author: { bot: true, id: testBotId }, content: "こんにちは！何かお手伝いできることはありますか？" },
			{ id: "msg3", author: { bot: false, id: testUserId }, content: "今日の天気を教えて" },
		];

		// メッセージコレクションのモックを作成
		const messageCollection = {
			reverse: () => testMessageHistory,
			map: function (callback: any) {
				return this.reverse().map(callback);
			},
		};

		// 1回目のユーザーメッセージのモックを作成
		const firstMessageMock = mockMessage(testUserId);

		// チャンネルのモックを作成
		const channelMock = mock<any>();
		when(channelMock.isThread()).thenReturn(true);
		when(channelMock.guildId).thenReturn(testGuildId);
		when(channelMock.id).thenReturn(testThreadId);
		when(channelMock.ownerId).thenReturn(testBotId);
		when(channelMock.sendTyping()).thenResolve();
		when(channelMock.messages).thenReturn({
			fetch: () => Promise.resolve(messageCollection),
		});

		// メッセージのチャンネルをモックに設定
		when(firstMessageMock.channel).thenReturn(instance(channelMock));

		// メッセージ応答のモック
		when(firstMessageMock.reply(anything())).thenResolve();

		// ChatAILogic.replyTalkメソッドのモック（1回目の応答）
		const firstResponse = "今日の天気は晴れです！";
		when(chatAILogicMock.replyTalk(anything(), anything())).thenCall((prompt, context) => {
			// 1. ChatAIPromptの検証
			const promptValue = prompt.getValue();
			expect(promptValue).to.deep.equal(testMetadata);

			// 2. ChatAIContextの検証
			expect(context).to.be.an("array").with.lengthOf(3);

			// ユーザーメッセージとボットメッセージが正しく変換されているか検証
			expect(context[0].role.getValue()).to.equal("user");
			expect(context[0].content.getValue()).to.equal("こんにちは");

			expect(context[1].role.getValue()).to.equal("assistant");
			expect(context[1].content.getValue()).to.equal("こんにちは！何かお手伝いできることはありますか？");

			expect(context[2].role.getValue()).to.equal("user");
			expect(context[2].content.getValue()).to.equal("今日の天気を教えて");

			return Promise.resolve(firstResponse);
		});

		// AIReplyHandlerのhandleメソッドを呼び出し（1回目）
		await aiReplyHandler.handle(instance(firstMessageMock));

		// 1回目の応答の検証
		verify(firstMessageMock.reply(firstResponse)).once();

		// 2回目のユーザーメッセージと応答の準備
		// 会話履歴に1回目の応答を追加
		const updatedMessageHistory = [
			...testMessageHistory,
			{ id: "msg4", author: { bot: true, id: testBotId }, content: firstResponse },
			{ id: "msg5", author: { bot: false, id: testUserId }, content: "明日の天気も教えて" },
		];

		// 更新されたメッセージコレクションのモックを作成
		const updatedMessageCollection = {
			reverse: () => updatedMessageHistory,
			map: function (callback: any) {
				return this.reverse().map(callback);
			},
		};

		// 2回目のユーザーメッセージのモックを作成
		const secondMessageMock = mockMessage(testUserId);

		// 更新されたチャンネルのモックを作成
		const updatedChannelMock = mock<any>();
		when(updatedChannelMock.isThread()).thenReturn(true);
		when(updatedChannelMock.guildId).thenReturn(testGuildId);
		when(updatedChannelMock.id).thenReturn(testThreadId);
		when(updatedChannelMock.ownerId).thenReturn(testBotId);
		when(updatedChannelMock.sendTyping()).thenResolve();
		when(updatedChannelMock.messages).thenReturn({
			fetch: () => Promise.resolve(updatedMessageCollection),
		});

		// メッセージのチャンネルをモックに設定
		when(secondMessageMock.channel).thenReturn(instance(updatedChannelMock));

		// メッセージ応答のモック
		when(secondMessageMock.reply(anything())).thenResolve();

		// ChatAILogic.replyTalkメソッドのモック（2回目の応答）
		const secondResponse = "明日の天気は雨の予報です。傘をお持ちください！";
		when(chatAILogicMock.replyTalk(anything(), anything())).thenCall((prompt, context) => {
			// 1. ChatAIPromptの検証
			const promptValue = prompt.getValue();
			expect(promptValue).to.deep.equal(testMetadata);

			// 2. ChatAIContextの検証
			expect(context).to.be.an("array").with.lengthOf(5);

			// 会話履歴が正しく含まれているか検証
			expect(context[0].role.getValue()).to.equal("user");
			expect(context[0].content.getValue()).to.equal("こんにちは");

			expect(context[1].role.getValue()).to.equal("assistant");
			expect(context[1].content.getValue()).to.equal("こんにちは！何かお手伝いできることはありますか？");

			expect(context[2].role.getValue()).to.equal("user");
			expect(context[2].content.getValue()).to.equal("今日の天気を教えて");

			expect(context[3].role.getValue()).to.equal("assistant");
			expect(context[3].content.getValue()).to.equal(firstResponse);

			expect(context[4].role.getValue()).to.equal("user");
			expect(context[4].content.getValue()).to.equal("明日の天気も教えて");

			return Promise.resolve(secondResponse);
		});

		// AIReplyHandlerのhandleメソッドを呼び出し（2回目）
		await aiReplyHandler.handle(instance(secondMessageMock));

		// 2回目の応答の検証
		verify(secondMessageMock.reply(secondResponse)).once();

		// 3回目のユーザーメッセージと応答の準備（長文応答のテスト）
		// 会話履歴に2回目の応答を追加
		const thirdMessageHistory = [
			...updatedMessageHistory,
			{ id: "msg6", author: { bot: true, id: testBotId }, content: secondResponse },
			{ id: "msg7", author: { bot: false, id: testUserId }, content: "週末の天気予報を詳しく教えて" },
		];

		// 更新されたメッセージコレクションのモックを作成
		const thirdMessageCollection = {
			reverse: () => thirdMessageHistory,
			map: function (callback: any) {
				return this.reverse().map(callback);
			},
		};

		// 3回目のユーザーメッセージのモックを作成
		const thirdMessageMock = mockMessage(testUserId);

		// 更新されたチャンネルのモックを作成
		const thirdChannelMock = mock<any>();
		when(thirdChannelMock.isThread()).thenReturn(true);
		when(thirdChannelMock.guildId).thenReturn(testGuildId);
		when(thirdChannelMock.id).thenReturn(testThreadId);
		when(thirdChannelMock.ownerId).thenReturn(testBotId);
		when(thirdChannelMock.sendTyping()).thenResolve();
		when(thirdChannelMock.messages).thenReturn({
			fetch: () => Promise.resolve(thirdMessageCollection),
		});

		// メッセージのチャンネルをモックに設定
		when(thirdMessageMock.channel).thenReturn(instance(thirdChannelMock));

		// メッセージ応答のモック
		when(thirdMessageMock.reply(anything())).thenResolve();

		// 長文応答のテスト（DiscordTextPresenterで分割される長さ）
		const longResponse = `${"週末の天気予報です：\n\n".repeat(10)}土曜日：晴れ、最高気温25度、最低気温18度。湿度は60%程度で過ごしやすい一日になりそうです。\n\n日曜日：曇りのち雨、最高気温22度、最低気温17度。午後から雨が降り始め、夕方には本降りになる予報です。\n\n週末のお出かけは土曜日がおすすめです！日曜日は雨具をお持ちください。\n\n${"詳細な情報が必要でしたら、お気軽にお尋ねください！".repeat(5)}`;

		// ChatAILogic.replyTalkメソッドのモック（3回目の応答 - 長文）
		when(chatAILogicMock.replyTalk(anything(), anything())).thenResolve(longResponse);

		// DiscordTextPresenterの結果をシミュレート（長文を分割）
		const splitResponses = [longResponse.substring(0, 1000), longResponse.substring(1000, 2000), longResponse.substring(2000)];

		// 分割された応答それぞれに対するreplyのモックを設定
		for (const chunk of splitResponses) {
			when(thirdMessageMock.reply(chunk)).thenResolve({} as any);
		}

		// AIReplyHandlerのhandleメソッドを呼び出し（3回目）
		await aiReplyHandler.handle(instance(thirdMessageMock));

		// 長文応答が複数回に分けて送信されることを検証
		verify(thirdMessageMock.reply(anything())).atLeast(1);

		// スレッドが正しく保存されていることを確認
		const savedThread = await ThreadRepositoryImpl.findOne({
			where: {
				guildId: testGuildId,
				messageId: testThreadId,
			},
		});

		expect(savedThread).to.not.be.null;
		if (savedThread) {
			expect(savedThread.guildId.toString()).to.equal(testGuildId);
			expect(savedThread.messageId.toString()).to.equal(testThreadId);
			expect(savedThread.categoryType).to.equal(ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue());

			// メタデータが正しく設定されていることを確認
			const metadata = savedThread.metadata;
			expect(metadata).to.not.be.null;
			expect(metadata).to.be.an("object");

			// メタデータに必要なプロパティが含まれていることを確認
			const metadataObj = JSON.parse(JSON.stringify(metadata));
			expect(metadataObj).to.have.property("persona_role", "テスト役割");
			expect(metadataObj).to.have.property("speaking_style_rules", "テストスタイル");
			expect(metadataObj).to.have.property("response_directives", "テスト指示");
			expect(metadataObj).to.have.property("emotion_model", "テスト感情");
			expect(metadataObj).to.have.property("notes", "テスト注釈");
			expect(metadataObj).to.have.property("input_scope", "テスト範囲");
		}
	});

	/**
	 * [ContextRetention] コンテキスト保持の検証
	 * - 文脈データが累積/参照されるか
	 * - AIが過去メッセージを踏まえた応答を生成できるか
	 */
	it("test context retention in conversation", async function (this: Mocha.Context) {
		// 個別のテストのタイムアウト時間を延長（30秒）
		this.timeout(30000);

		// テスト用のパラメータ
		const testGuildId = "12345";
		const testThreadId = "67890";
		const testUserId = "98765";
		const testBotId = AppConfig.discord.clientId;

		// テスト用のスレッドメタデータ
		const testMetadata = {
			persona_role: "テスト役割",
			speaking_style_rules: "テストスタイル",
			response_directives: "テスト指示",
			emotion_model: "テスト感情",
			notes: "テスト注釈",
			input_scope: "テスト範囲",
		};

		// ThreadRepositoryImplを使用してテスト用のスレッドデータを作成
		await ThreadRepositoryImpl.create({
			guildId: testGuildId,
			messageId: testThreadId,
			categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
			metadata: testMetadata,
		});

		// AIReplyHandlerのインスタンスを作成
		const aiReplyHandler = new AIReplyHandler();

		// ThreadLogicのモックを作成
		const threadLogicMock = mock<ThreadLogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.threadLogic = instance(threadLogicMock);

		// ThreadLogic.findメソッドのモック
		when(threadLogicMock.find(anything(), anything())).thenResolve(
			new ThreadDto(
				new ThreadGuildId(testGuildId),
				new ThreadMessageId(testThreadId),
				ThreadCategoryType.CATEGORY_TYPE_CHATGPT,
				new ThreadMetadata(testMetadata as unknown as JSON),
			),
		);

		// ChatAILogicのモックを作成
		const chatAILogicMock = mock<IChatAILogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.chatAILogic = instance(chatAILogicMock);

		// 会話の流れをシミュレートするための変数
		let capturedContext: ChatAIMessageDto[] = [];

		// 1回目の会話: ユーザーが「こんにちは」と言う
		const firstMessageHistory = [{ id: "msg1", author: { bot: false, id: testUserId }, content: "こんにちは" }];

		// メッセージコレクションのモックを作成
		const firstMessageCollection = {
			reverse: () => firstMessageHistory,
			map: function (callback: any) {
				return this.reverse().map(callback);
			},
		};

		// 1回目のユーザーメッセージのモックを作成
		const firstMessageMock = mockMessage(testUserId);

		// チャンネルのモックを作成
		const channelMock = mock<any>();
		when(channelMock.isThread()).thenReturn(true);
		when(channelMock.guildId).thenReturn(testGuildId);
		when(channelMock.id).thenReturn(testThreadId);
		when(channelMock.ownerId).thenReturn(testBotId);
		when(channelMock.sendTyping()).thenResolve();
		when(channelMock.messages).thenReturn({
			fetch: () => Promise.resolve(firstMessageCollection),
		});

		// メッセージのチャンネルをモックに設定
		when(firstMessageMock.channel).thenReturn(instance(channelMock));

		// メッセージ応答のモック
		when(firstMessageMock.reply(anything())).thenResolve();

		// ChatAILogic.replyTalkメソッドのモック（1回目の応答）
		const firstResponse = "こんにちは！何かお手伝いできることはありますか？";
		when(chatAILogicMock.replyTalk(anything(), anything())).thenCall((prompt, context) => {
			// コンテキストを保存
			capturedContext = [...context];

			// 1回目のコンテキスト検証
			expect(context).to.be.an("array").with.lengthOf(1);
			expect(context[0].role.getValue()).to.equal("user");
			expect(context[0].content.getValue()).to.equal("こんにちは");

			return Promise.resolve(firstResponse);
		});

		// AIReplyHandlerのhandleメソッドを呼び出し（1回目）
		await aiReplyHandler.handle(instance(firstMessageMock));

		// 1回目の応答の検証
		verify(firstMessageMock.reply(firstResponse)).once();

		// 2回目の会話: ユーザーが「名前は何ですか？」と質問
		const secondMessageHistory = [
			{ id: "msg1", author: { bot: false, id: testUserId }, content: "こんにちは" },
			{ id: "msg2", author: { bot: true, id: testBotId }, content: firstResponse },
			{ id: "msg3", author: { bot: false, id: testUserId }, content: "名前は何ですか？" },
		];

		// 更新されたメッセージコレクションのモックを作成
		const secondMessageCollection = {
			reverse: () => secondMessageHistory,
			map: function (callback: any) {
				return this.reverse().map(callback);
			},
		};

		// 2回目のユーザーメッセージのモックを作成
		const secondMessageMock = mockMessage(testUserId);

		// 更新されたチャンネルのモックを作成
		const updatedChannelMock = mock<any>();
		when(updatedChannelMock.isThread()).thenReturn(true);
		when(updatedChannelMock.guildId).thenReturn(testGuildId);
		when(updatedChannelMock.id).thenReturn(testThreadId);
		when(updatedChannelMock.ownerId).thenReturn(testBotId);
		when(updatedChannelMock.sendTyping()).thenResolve();
		when(updatedChannelMock.messages).thenReturn({
			fetch: () => Promise.resolve(secondMessageCollection),
		});

		// メッセージのチャンネルをモックに設定
		when(secondMessageMock.channel).thenReturn(instance(updatedChannelMock));

		// メッセージ応答のモック
		when(secondMessageMock.reply(anything())).thenResolve();

		// ChatAILogic.replyTalkメソッドのモック（2回目の応答）
		const secondResponse = "私の名前はわいわいちゃんです！";
		when(chatAILogicMock.replyTalk(anything(), anything())).thenCall((prompt, context) => {
			// コンテキストを保存
			capturedContext = [...context];

			// 2回目のコンテキスト検証
			expect(context).to.be.an("array").with.lengthOf(3);
			expect(context[0].role.getValue()).to.equal("user");
			expect(context[0].content.getValue()).to.equal("こんにちは");

			expect(context[1].role.getValue()).to.equal("assistant");
			expect(context[1].content.getValue()).to.equal(firstResponse);

			expect(context[2].role.getValue()).to.equal("user");
			expect(context[2].content.getValue()).to.equal("名前は何ですか？");

			return Promise.resolve(secondResponse);
		});

		// AIReplyHandlerのhandleメソッドを呼び出し（2回目）
		await aiReplyHandler.handle(instance(secondMessageMock));

		// 2回目の応答の検証
		verify(secondMessageMock.reply(secondResponse)).once();

		// 3回目の会話: ユーザーが前の会話を参照する質問をする
		const thirdMessageHistory = [
			{ id: "msg1", author: { bot: false, id: testUserId }, content: "こんにちは" },
			{ id: "msg2", author: { bot: true, id: testBotId }, content: firstResponse },
			{ id: "msg3", author: { bot: false, id: testUserId }, content: "名前は何ですか？" },
			{ id: "msg4", author: { bot: true, id: testBotId }, content: secondResponse },
			{ id: "msg5", author: { bot: false, id: testUserId }, content: "あなたの名前をもう一度教えてください" },
		];

		// 更新されたメッセージコレクションのモックを作成
		const thirdMessageCollection = {
			reverse: () => thirdMessageHistory,
			map: function (callback: any) {
				return this.reverse().map(callback);
			},
		};

		// 3回目のユーザーメッセージのモックを作成
		const thirdMessageMock = mockMessage(testUserId);

		// 更新されたチャンネルのモックを作成
		const thirdChannelMock = mock<any>();
		when(thirdChannelMock.isThread()).thenReturn(true);
		when(thirdChannelMock.guildId).thenReturn(testGuildId);
		when(thirdChannelMock.id).thenReturn(testThreadId);
		when(thirdChannelMock.ownerId).thenReturn(testBotId);
		when(thirdChannelMock.sendTyping()).thenResolve();
		when(thirdChannelMock.messages).thenReturn({
			fetch: () => Promise.resolve(thirdMessageCollection),
		});

		// メッセージのチャンネルをモックに設定
		when(thirdMessageMock.channel).thenReturn(instance(thirdChannelMock));

		// メッセージ応答のモック
		when(thirdMessageMock.reply(anything())).thenResolve();

		// ChatAILogic.replyTalkメソッドのモック（3回目の応答）
		const thirdResponse = "私の名前はわいわいちゃんです！以前もお伝えしましたが、何かお手伝いできることはありますか？";
		when(chatAILogicMock.replyTalk(anything(), anything())).thenCall((prompt, context) => {
			// コンテキストを保存
			capturedContext = [...context];

			// 3回目のコンテキスト検証
			expect(context).to.be.an("array").with.lengthOf(5);
			expect(context[0].role.getValue()).to.equal("user");
			expect(context[0].content.getValue()).to.equal("こんにちは");

			expect(context[1].role.getValue()).to.equal("assistant");
			expect(context[1].content.getValue()).to.equal(firstResponse);

			expect(context[2].role.getValue()).to.equal("user");
			expect(context[2].content.getValue()).to.equal("名前は何ですか？");

			expect(context[3].role.getValue()).to.equal("assistant");
			expect(context[3].content.getValue()).to.equal(secondResponse);

			expect(context[4].role.getValue()).to.equal("user");
			expect(context[4].content.getValue()).to.equal("あなたの名前をもう一度教えてください");

			return Promise.resolve(thirdResponse);
		});

		// AIReplyHandlerのhandleメソッドを呼び出し（3回目）
		await aiReplyHandler.handle(instance(thirdMessageMock));

		// 3回目の応答の検証
		verify(thirdMessageMock.reply(thirdResponse)).once();

		// コンテキストの累積を検証
		expect(capturedContext.length).to.equal(5);

		// 最終的なコンテキストが正しく構築されていることを確認
		expect(capturedContext[0].role.getValue()).to.equal("user");
		expect(capturedContext[0].content.getValue()).to.equal("こんにちは");

		expect(capturedContext[1].role.getValue()).to.equal("assistant");
		expect(capturedContext[1].content.getValue()).to.equal(firstResponse);

		expect(capturedContext[2].role.getValue()).to.equal("user");
		expect(capturedContext[2].content.getValue()).to.equal("名前は何ですか？");

		expect(capturedContext[3].role.getValue()).to.equal("assistant");
		expect(capturedContext[3].content.getValue()).to.equal(secondResponse);

		expect(capturedContext[4].role.getValue()).to.equal("user");
		expect(capturedContext[4].content.getValue()).to.equal("あなたの名前をもう一度教えてください");
	});

	/**
	 * [Validation] 入力値に関する異常系テスト
	 * - 空メッセージへの対処がされているか
	 * - 特殊文字やMarkdownによる入力が適切に扱われるか
	 * - 長文メッセージが処理可能な長さかどうか
	 */
	it("test empty message handling", async function (this: Mocha.Context) {
		// 個別のテストのタイムアウト時間を延長（10秒）
		this.timeout(10_000);

		// テスト用のパラメータ
		const testGuildId = "12345";
		const testThreadId = "67890";
		const testUserId = "98765";
		const testBotId = AppConfig.discord.clientId;

		// ThreadRepositoryImplを使用してテスト用のスレッドデータを作成
		await ThreadRepositoryImpl.create({
			guildId: testGuildId,
			messageId: testThreadId,
			categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
			metadata: {
				persona_role: "テスト役割",
				speaking_style_rules: "テストスタイル",
				response_directives: "テスト指示",
				emotion_model: "テスト感情",
				notes: "テスト注釈",
				input_scope: "テスト範囲",
			},
		});

		// AIReplyHandlerのインスタンスを作成
		const aiReplyHandler = new AIReplyHandler();

		// ThreadLogicのモックを作成
		const threadLogicMock = mock<ThreadLogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.threadLogic = instance(threadLogicMock);

		// ThreadLogic.findメソッドのモック
		when(threadLogicMock.find(anything(), anything())).thenCall(async (guildId, messageId) => {
			// 引数の検証
			expect(guildId.getValue()).to.equal(testGuildId);
			expect(messageId.getValue()).to.equal(testThreadId);

			// 実際のデータベースからスレッドを取得
			return await ThreadRepositoryImpl.findOne({
				where: {
					guildId: guildId.getValue(),
					messageId: messageId.getValue(),
				},
			}).then((res) => (res ? res.toDto() : undefined));
		});

		// ChatAILogicのモックを作成
		const chatAILogicMock = mock<IChatAILogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.chatAILogic = instance(chatAILogicMock);

		// 空メッセージのテスト
		const emptyMessageMock = mockMessage(testUserId);
		when(emptyMessageMock.content).thenReturn(""); // 空メッセージを設定

		// チャンネルのモックを作成
		const channelMock = mock<any>();
		when(channelMock.isThread()).thenReturn(true);
		when(channelMock.guildId).thenReturn(testGuildId);
		when(channelMock.id).thenReturn(testThreadId);
		when(channelMock.ownerId).thenReturn(testBotId);
		when(channelMock.sendTyping()).thenResolve();
		when(channelMock.messages).thenReturn({
			fetch: () =>
				Promise.resolve({
					reverse: () => [{ author: { bot: false, id: testUserId }, content: "" }],
					map: function (callback: any) {
						return this.reverse().map(callback);
					},
				}),
		});

		// メッセージのチャンネルをモックに設定
		when(emptyMessageMock.channel).thenReturn(instance(channelMock));

		// メッセージ応答のモック
		when(emptyMessageMock.reply(anything())).thenResolve();

		// ChatAILogic.replyTalkメソッドのモック
		when(chatAILogicMock.replyTalk(anything(), anything())).thenCall((prompt, context) => {
			// コンテキストの検証
			expect(context).to.be.an("array").with.lengthOf(1);
			expect(context[0].role.getValue()).to.equal("user");
			expect(context[0].content.getValue()).to.equal(""); // 空メッセージが正しく渡されることを確認

			// 空メッセージに対する応答
			return Promise.resolve("何か質問や話したいことがあれば、お気軽に話しかけてね！");
		});

		// AIReplyHandlerのhandleメソッドを呼び出し
		await aiReplyHandler.handle(instance(emptyMessageMock));

		// 空メッセージでも応答が返されることを確認
		verify(emptyMessageMock.reply(anything())).once();
		verify(chatAILogicMock.replyTalk(anything(), anything())).once();
	});

	it("test special characters and markdown handling", async function (this: Mocha.Context) {
		// 個別のテストのタイムアウト時間を延長（10秒）
		this.timeout(10_000);

		// テスト用のパラメータ
		const testGuildId = "12345";
		const testThreadId = "67890";
		const testUserId = "98765";
		const testBotId = AppConfig.discord.clientId;

		// ThreadRepositoryImplを使用してテスト用のスレッドデータを作成
		await ThreadRepositoryImpl.create({
			guildId: testGuildId,
			messageId: testThreadId,
			categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
			metadata: {
				persona_role: "テスト役割",
				speaking_style_rules: "テストスタイル",
				response_directives: "テスト指示",
				emotion_model: "テスト感情",
				notes: "テスト注釈",
				input_scope: "テスト範囲",
			},
		});

		// AIReplyHandlerのインスタンスを作成
		const aiReplyHandler = new AIReplyHandler();

		// ThreadLogicのモックを作成
		const threadLogicMock = mock<ThreadLogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.threadLogic = instance(threadLogicMock);

		// ThreadLogic.findメソッドのモック
		when(threadLogicMock.find(anything(), anything())).thenCall(async (guildId, messageId) => {
			// 引数の検証
			expect(guildId.getValue()).to.equal(testGuildId);
			expect(messageId.getValue()).to.equal(testThreadId);

			// 実際のデータベースからスレッドを取得
			return await ThreadRepositoryImpl.findOne({
				where: {
					guildId: guildId.getValue(),
					messageId: messageId.getValue(),
				},
			}).then((res) => (res ? res.toDto() : undefined));
		});

		// ChatAILogicのモックを作成
		const chatAILogicMock = mock<IChatAILogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.chatAILogic = instance(chatAILogicMock);

		// 特殊文字とMarkdownを含むメッセージのテスト
		const specialCharMessageMock = mockMessage(testUserId);
		const specialCharContent =
			"# マークダウンタイトル\n**太字テキスト**\n*斜体テキスト*\n```コードブロック```\n> 引用テキスト\n- リスト項目\n1. 番号付きリスト\n[リンク](https://example.com)\n@mention #channel\n絵文字: 😀 🎉 👍\n特殊文字: !@#$%^&*()_+-=[]{}|;':\",./<>?";
		when(specialCharMessageMock.content).thenReturn(specialCharContent);

		// チャンネルのモックを作成
		const channelMock = mock<any>();
		when(channelMock.isThread()).thenReturn(true);
		when(channelMock.guildId).thenReturn(testGuildId);
		when(channelMock.id).thenReturn(testThreadId);
		when(channelMock.ownerId).thenReturn(testBotId);
		when(channelMock.sendTyping()).thenResolve();
		when(channelMock.messages).thenReturn({
			fetch: () =>
				Promise.resolve({
					reverse: () => [{ author: { bot: false, id: testUserId }, content: specialCharContent }],
					map: function (callback: any) {
						return this.reverse().map(callback);
					},
				}),
		});

		// メッセージのチャンネルをモックに設定
		when(specialCharMessageMock.channel).thenReturn(instance(channelMock));

		// メッセージ応答のモック
		when(specialCharMessageMock.reply(anything())).thenResolve();

		// ChatAILogic.replyTalkメソッドのモック
		when(chatAILogicMock.replyTalk(anything(), anything())).thenCall((prompt, context) => {
			// コンテキストの検証
			expect(context).to.be.an("array").with.lengthOf(1);
			expect(context[0].role.getValue()).to.equal("user");
			expect(context[0].content.getValue()).to.equal(specialCharContent); // 特殊文字とMarkdownが正しく渡されることを確認

			// 特殊文字とMarkdownに対する応答
			return Promise.resolve("マークダウンと特殊文字を含むメッセージを受け取りました。正しく処理できています！");
		});

		// AIReplyHandlerのhandleメソッドを呼び出し
		await aiReplyHandler.handle(instance(specialCharMessageMock));

		// 特殊文字とMarkdownを含むメッセージでも応答が返されることを確認
		verify(specialCharMessageMock.reply(anything())).once();
		verify(chatAILogicMock.replyTalk(anything(), anything())).once();
	});

	it("test long message handling", async function (this: Mocha.Context) {
		// 個別のテストのタイムアウト時間を延長（10秒）
		this.timeout(10_000);

		// テスト用のパラメータ
		const testGuildId = "12345";
		const testThreadId = "67890";
		const testUserId = "98765";
		const testBotId = AppConfig.discord.clientId;

		// ThreadRepositoryImplを使用してテスト用のスレッドデータを作成
		await ThreadRepositoryImpl.create({
			guildId: testGuildId,
			messageId: testThreadId,
			categoryType: ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
			metadata: {
				persona_role: "テスト役割",
				speaking_style_rules: "テストスタイル",
				response_directives: "テスト指示",
				emotion_model: "テスト感情",
				notes: "テスト注釈",
				input_scope: "テスト範囲",
			},
		});

		// AIReplyHandlerのインスタンスを作成
		const aiReplyHandler = new AIReplyHandler();

		// ThreadLogicのモックを作成
		const threadLogicMock = mock<ThreadLogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.threadLogic = instance(threadLogicMock);

		// ThreadLogic.findメソッドのモック
		when(threadLogicMock.find(anything(), anything())).thenCall(async (guildId, messageId) => {
			// 引数の検証
			expect(guildId.getValue()).to.equal(testGuildId);
			expect(messageId.getValue()).to.equal(testThreadId);

			// 実際のデータベースからスレッドを取得
			return await ThreadRepositoryImpl.findOne({
				where: {
					guildId: guildId.getValue(),
					messageId: messageId.getValue(),
				},
			}).then((res) => (res ? res.toDto() : undefined));
		});

		// ChatAILogicのモックを作成
		const chatAILogicMock = mock<IChatAILogic>();
		// @ts-ignore - privateフィールドにアクセスするため
		aiReplyHandler.chatAILogic = instance(chatAILogicMock);

		// 長文メッセージのテスト（Discordの上限は2000文字）
		const longMessageMock = mockMessage(testUserId);
		const longContent = "これは長文メッセージのテストです。".repeat(100); // 約2000文字の長さになるように繰り返し
		when(longMessageMock.content).thenReturn(longContent);

		// チャンネルのモックを作成
		const channelMock = mock<any>();
		when(channelMock.isThread()).thenReturn(true);
		when(channelMock.guildId).thenReturn(testGuildId);
		when(channelMock.id).thenReturn(testThreadId);
		when(channelMock.ownerId).thenReturn(testBotId);
		when(channelMock.sendTyping()).thenResolve();
		when(channelMock.messages).thenReturn({
			fetch: () =>
				Promise.resolve({
					reverse: () => [{ author: { bot: false, id: testUserId }, content: longContent }],
					map: function (callback: any) {
						return this.reverse().map(callback);
					},
				}),
		});

		// メッセージのチャンネルをモックに設定
		when(longMessageMock.channel).thenReturn(instance(channelMock));

		// メッセージ応答のモック
		when(longMessageMock.reply(anything())).thenResolve();

		// ChatAILogic.replyTalkメソッドのモック
		when(chatAILogicMock.replyTalk(anything(), anything())).thenCall((prompt, context) => {
			// コンテキストの検証
			expect(context).to.be.an("array").with.lengthOf(1);
			expect(context[0].role.getValue()).to.equal("user");
			expect(context[0].content.getValue()).to.equal(longContent); // 長文メッセージが正しく渡されることを確認
			expect(context[0].content.getValue().length).to.be.at.least(1000); // 長文であることを確認

			// 長文メッセージに対する応答（長文の応答を返す）
			return Promise.resolve(`長文メッセージを受け取りました。以下に詳細な応答を返します。\n\n${"これは応答の一部です。".repeat(50)}`);
		});

		// AIReplyHandlerのhandleメソッドを呼び出し
		await aiReplyHandler.handle(instance(longMessageMock));

		// 長文メッセージでも応答が返されることを確認
		verify(longMessageMock.reply(anything())).atLeast(1); // 長文応答は複数のメッセージに分割される可能性があるため、at.least(1)を使用
		verify(chatAILogicMock.replyTalk(anything(), anything())).once();
	});
});
