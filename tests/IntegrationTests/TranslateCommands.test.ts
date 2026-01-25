import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import { TranslateConst } from "@/src/entities/constants/translate";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityRepositoryImpl } from "@/src/repositories/sequelize-mysql/CommunityRepositoryImpl";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { createMockMessage, mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import type { CacheType, ChatInputCommandInteraction, Client, Message } from "discord.js";
import { anything, instance, verify, when } from "ts-mockito";

// 型安全な定数定義（Non-null assertion）
const JAPANESE_SOURCE = TranslateConst.source.find((it) => it.value === "JA")?.value as string;
const JAPANESE_TARGET = TranslateConst.target.find((it) => it.value === "JA")?.value as string;
const ENGLISH_SOURCE = TranslateConst.source.find((it) => it.value === "EN")?.value as string;
const ENGLISH_TARGET = TranslateConst.target.find((it) => it.value === "EN-US")?.value as string;

// テスト用のguildId（MockSlashCommandで使用される値と一致させる）
const TEST_GUILD_ID = "9999";

// ============================================================
// 型定義
// ============================================================

/**
 * translateコマンドのパラメータ型
 */
interface TranslateCommandParams {
	readonly title: string | null;
	readonly source: string | null | undefined;
	readonly target: string | null | undefined;
}

/**
 * モックスラッシュコマンドのオプション型
 */
interface MockSlashCommandOptions {
	readonly withChannel?: boolean;
	readonly replyMessage?: Message;
}

/**
 * Reply結果をキャプチャする型
 */
interface ReplyCapture {
	content: string;
}

/**
 * translateコマンドのセットアップ結果型
 */
interface SetupTranslateCommandResult {
	readonly commandMock: ChatInputCommandInteraction<CacheType>;
	readonly message: Message;
	readonly client: Client;
	readonly capturedResult: ReplyCapture;
}

// ============================================================
// Repositoryテスト用ヘルパー関数
// ============================================================

/**
 * データベース接続を初期化し、ログを無効化する
 */
function initializeDatabaseWithoutLogging(): void {
	const connector = new MysqlConnector();
	// プライベートフィールドへのアクセス（テスト用途のため許容）
	// biome-ignore lint/suspicious/noExplicitAny: テスト用のプライベートフィールドアクセス
	(connector as any).instance.options.logging = false;
}

/**
 * CommunityRepositoryのデータをクリーンアップする
 */
async function cleanupCommunityRepository(): Promise<void> {
	await CommunityRepositoryImpl.destroy({
		truncate: true,
		force: true,
	});
}

/**
 * テスト用のコミュニティを作成する（型安全版）
 * @param clientId - クライアントID（デフォルト: TEST_GUILD_ID）
 * @param categoryType - カテゴリタイプ（デフォルト: Discord）
 * @returns 作成されたコミュニティモデルインスタンス
 */
async function createTestCommunity(
	clientId: string = TEST_GUILD_ID,
	categoryType: CommunityCategoryType = CommunityCategoryType.Discord,
): Promise<InstanceType<typeof CommunityRepositoryImpl>> {
	return await CommunityRepositoryImpl.create({
		categoryType: categoryType.getValue(),
		clientId: BigInt(clientId),
		batchStatus: 0,
	});
}

/**
 * コミュニティIDでコミュニティを検索する（型安全版）
 * @param clientId - クライアントID
 * @returns コミュニティまたはnull
 */
async function findCommunityByClientId(
	clientId: string,
): Promise<InstanceType<typeof CommunityRepositoryImpl> | null> {
	return await CommunityRepositoryImpl.findOne({
		where: {
			clientId: BigInt(clientId),
		},
	});
}

/**
 * 全コミュニティを取得する（型安全版）
 * @returns コミュニティの配列
 */
async function findAllCommunities(): Promise<InstanceType<typeof CommunityRepositoryImpl>[]> {
	return await CommunityRepositoryImpl.findAll();
}

/**
 * コミュニティが作成されていないことを検証する
 */
async function assertNoCommunityCreated(): Promise<void> {
	const communities = await findAllCommunities();
	expect(communities.length).to.eq(0);
}

/**
 * コミュニティ数を検証する
 * @param expectedCount - 期待するコミュニティ数
 */
async function assertCommunityCount(expectedCount: number): Promise<void> {
	const communities = await findAllCommunities();
	expect(communities.length).to.eq(expectedCount);
}

/**
 * コミュニティが存在することを検証する
 * @param clientId - クライアントID
 */
async function assertCommunityExists(clientId: string): Promise<void> {
	const community = await findCommunityByClientId(clientId);
	expect(community).to.not.be.null;
}

/**
 * コミュニティが存在しないことを検証する
 * @param clientId - クライアントID
 */
async function assertCommunityNotExists(clientId: string): Promise<void> {
	const community = await findCommunityByClientId(clientId);
	expect(community).to.be.null;
}

/**
 * データベースのセットアップを一括で行う
 * ログ無効化、クリーンアップ、テストデータ作成を実行
 * @param clientId - クライアントID（デフォルト: TEST_GUILD_ID）
 */
async function setupTestDatabase(clientId: string = TEST_GUILD_ID): Promise<void> {
	initializeDatabaseWithoutLogging();
	await cleanupCommunityRepository();
	await createTestCommunity(clientId);
}

// ============================================================
// Handler初期化の共通ヘルパー関数
// ============================================================

/**
 * Discordクライアントを取得する
 * @returns Discordクライアント
 */
async function getDiscordClient(): Promise<Client> {
	return await TestDiscordServer.getClient();
}

/**
 * translateコマンドのモックを作成する（型安全版）
 * @param params - コマンドパラメータ
 * @param withChannel - チャンネルを含めるか（デフォルト: true）
 * @returns コマンドモック
 */
function createTranslateCommandMock(
	params: TranslateCommandParams,
	withChannel = true,
): ChatInputCommandInteraction<CacheType> {
	return mockSlashCommand("translate", params, { withChannel });
}

/**
 * Replyキャプチャをセットアップする（型安全版）
 * @param commandMock - コマンドモック
 * @param message - レスポンスメッセージ
 * @returns キャプチャ結果を格納するオブジェクト
 */
function setupReplyCapture(
	commandMock: ChatInputCommandInteraction<CacheType>,
	message: Message,
): ReplyCapture {
	const capturedResult: ReplyCapture = { content: "" };
	
	when(commandMock.reply(anything())).thenCall((arg: string | { content?: string }) => {
		capturedResult.content = typeof arg === "string" ? arg : arg.content ?? "";
		return Promise.resolve(message);
	});
	
	return capturedResult;
}

/**
 * translateコマンドのモックをセットアップする共通関数
 * クライアント取得、モック作成、Replyキャプチャの設定を一括実行
 * @param params - コマンドパラメータ
 * @param options - モックオプション
 * @returns セットアップ結果
 */
async function setupTranslateCommand(
	params: TranslateCommandParams,
	options: MockSlashCommandOptions = {},
): Promise<SetupTranslateCommandResult> {
	const { message } = createMockMessage();
	const client = await getDiscordClient();
	const commandMock = createTranslateCommandMock(params, options.withChannel ?? true);
	const capturedResult = setupReplyCapture(commandMock, message);

	return { commandMock, message, client, capturedResult };
}

// ============================================================
// イベント登録テスト用ヘルパー関数
// ============================================================

/**
 * Discord interactionイベントを発行する（型安全版）
 * @param client - Discordクライアント
 * @param commandMock - コマンドモック
 */
async function emitTranslateInteractionEvent(
	client: Client,
	commandMock: ChatInputCommandInteraction<CacheType>,
): Promise<void> {
	client.emit("interactionCreate", instance(commandMock));
}

/**
 * translateコマンドのreply完了を待つ（型安全版）
 * @param commandMock - コマンドモック
 */
async function waitForTranslateReply(
	commandMock: ChatInputCommandInteraction<CacheType>,
): Promise<void> {
	await waitUntilReply(commandMock);
}

/**
 * replyが1回呼ばれたことを検証する（型安全版）
 * @param commandMock - コマンドモック
 */
function verifyReplyCalledOnce(
	commandMock: ChatInputCommandInteraction<CacheType>,
): void {
	verify(commandMock.reply(anything())).once();
}

/**
 * replyが呼ばれなかったことを検証する（型安全版）
 * @param commandMock - コマンドモック
 */
function verifyReplyNotCalled(
	commandMock: ChatInputCommandInteraction<CacheType>,
): void {
	verify(commandMock.reply(anything())).never();
}

/**
 * マッチタイプの型定義
 */
type MatchType = "include" | "equal";

/**
 * replyの内容を検証する（型安全版）
 * @param capturedResult - キャプチャされた結果
 * @param expected - 期待する文字列
 * @param matchType - マッチタイプ（'include' または 'equal'）デフォルトは 'include'
 */
function verifyReplyContent(
	capturedResult: ReplyCapture,
	expected: string,
	matchType: MatchType = "include",
): void {
	if (matchType === "equal") {
		expect(capturedResult.content).to.equal(expected);
	} else {
		expect(capturedResult.content).to.include(expected);
	}
}

/**
 * executeAndVerifyTranslateCommandのオプション型定義
 */
interface ExecuteAndVerifyOptions {
	/** チャンネルを含めるか（デフォルト: true） */
	readonly withChannel?: boolean;
	/** 期待するレスポンス内容 */
	readonly expectedContent?: string;
	/** マッチタイプ（'include' または 'equal'）（デフォルト: 'include'） */
	readonly expectedMatchType?: MatchType;
	/** replyが呼ばれるべきか（デフォルト: true） */
	readonly shouldReply?: boolean;
}

/**
 * タイムアウト定数
 */
const WAIT_TIMEOUT_MS = 500 as const;

/**
 * translateコマンドの実行と検証を一括で行うヘルパー（型安全版）
 * セットアップ→実行→検証を一括実行
 * @param params - translateコマンドのパラメータ
 * @param options - 実行オプション
 * @returns セットアップ結果
 */
async function executeAndVerifyTranslateCommand(
	params: TranslateCommandParams,
	options: ExecuteAndVerifyOptions = {},
): Promise<SetupTranslateCommandResult> {
	const {
		withChannel = true,
		expectedContent,
		expectedMatchType = "include",
		shouldReply = true,
	} = options;

	// セットアップ
	const result = await setupTranslateCommand(params, { withChannel });

	// イベント発行
	await emitTranslateInteractionEvent(result.client, result.commandMock);

	// shouldReplyがfalseの場合は早期リターン前の待機のみ
	if (!shouldReply) {
		await new Promise<void>((resolve) => setTimeout(resolve, WAIT_TIMEOUT_MS));
		verifyReplyNotCalled(result.commandMock);
		return result;
	}

	// reply完了を待つ
	await waitForTranslateReply(result.commandMock);

	// 検証
	verifyReplyCalledOnce(result.commandMock);

	if (expectedContent !== undefined) {
		verifyReplyContent(result.capturedResult, expectedContent, expectedMatchType);
	}

	return result;
}

describe("Test Translate Command", () => {
	beforeEach(async () => {
		await setupTestDatabase();
	});
	/**
	 * TranslateCommandHandlerのテスト
	 */
	describe("Test /translate command", () => {
		/**
		 * [正常系] title、source、targetを指定して翻訳スレッドを作成
		 * - コマンドが正常に実行されることを検証
		 * - replyが呼ばれることを検証
		 * - 翻訳場の案内メッセージが返されることを検証
		 */
		it("Test /translate title:テスト source:EN target:JA", async () => {
			await executeAndVerifyTranslateCommand(
				{
					title: "テスト翻訳スレッド",
					source: ENGLISH_SOURCE,
					target: JAPANESE_TARGET,
				},
				{
					expectedContent: "ENからJAに翻訳する場を用意したよ！っ",
				},
			);
		});

		/**
		 * [正常系] 日本語から英語への翻訳スレッド作成
		 * - コマンドが正常に実行されることを検証
		 * - 翻訳場の案内メッセージが返されることを検証
		 */
		it("Test /translate title:テスト source:JA target:EN-US", async () => {
			await executeAndVerifyTranslateCommand(
				{
					title: "日英翻訳スレッド",
					source: JAPANESE_SOURCE,
					target: ENGLISH_TARGET,
				},
				{
					expectedContent: "JAからEN-USに翻訳する場を用意したよ！っ",
				},
			);
		});

		/**
		 * [エラー系] sourceとtargetが同じ場合
		 * - sourceとtargetが同じ場合にエラーメッセージが返されることを検証
		 */
		it("Test /translate source:JA target:JA (same source and target)", async () => {
			await executeAndVerifyTranslateCommand(
				{
					title: "同一言語テスト",
					source: JAPANESE_SOURCE,
					target: JAPANESE_TARGET,
				},
				{
					expectedContent: "sourceとtargetが同じだよ！っ",
					expectedMatchType: "equal",
				},
			);
		});

		/**
		 * [エラー系] channelがnullの場合
		 * - channelがnullの場合は何も返さずに早期リターンすることを検証
		 * - replyが呼ばれないことを検証
		 */
		it("Test /translate with null channel", async () => {
			await executeAndVerifyTranslateCommand(
				{
					title: "テスト",
					source: ENGLISH_SOURCE,
					target: JAPANESE_TARGET,
				},
				{
					withChannel: false,
					shouldReply: false,
				},
			);
		});

		/**
		 * [エラー系] titleがnullの場合
		 * - titleが指定されていない場合に内部エラーメッセージが返されることを検証
		 */
		it("Test /translate title:null", async () => {
			await executeAndVerifyTranslateCommand(
				{
					title: null,
					source: ENGLISH_SOURCE,
					target: JAPANESE_TARGET,
				},
				{
					expectedContent: InternalErrorMessage,
					expectedMatchType: "equal",
				},
			);
		});

		/**
		 * [エラー系] sourceがnullの場合
		 * - sourceが指定されていない場合に内部エラーメッセージが返されることを検証
		 */
		it("Test /translate source:null", async () => {
			await executeAndVerifyTranslateCommand(
				{
					title: "テスト",
					source: null,
					target: JAPANESE_TARGET,
				},
				{
					expectedContent: InternalErrorMessage,
					expectedMatchType: "equal",
				},
			);
		});

		/**
		 * [エラー系] targetがnullの場合
		 * - targetが指定されていない場合に内部エラーメッセージが返されることを検証
		 */
		it("Test /translate target:null", async () => {
			await executeAndVerifyTranslateCommand(
				{
					title: "テスト",
					source: ENGLISH_SOURCE,
					target: null,
				},
				{
					expectedContent: InternalErrorMessage,
					expectedMatchType: "equal",
				},
			);
		});

		/**
		 * [エラー系] 全パラメータがnullの場合
		 * - 全パラメータがnullの場合に内部エラーメッセージが返されることを検証
		 */
		it("Test /translate all params null", async () => {
			await executeAndVerifyTranslateCommand(
				{
					title: null,
					source: null,
					target: null,
				},
				{
					expectedContent: InternalErrorMessage,
					expectedMatchType: "equal",
				},
			);
		});
	});
});
