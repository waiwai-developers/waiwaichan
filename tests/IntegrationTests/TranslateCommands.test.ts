import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import { TranslateConst } from "@/src/entities/constants/translate";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityRepositoryImpl } from "@/src/repositories/sequelize-mysql/CommunityRepositoryImpl";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { createMockMessage, mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import type { Client, Message } from "discord.js";
import { anything, instance, verify, when } from "ts-mockito";

const JAPANESE_SOURCE = TranslateConst.source.find((it) => it.value === "JA")?.value;
const JAPANESE_TARGET = TranslateConst.target.find((it) => it.value === "JA")?.value;
const ENGLISH_SOURCE = TranslateConst.source.find((it) => it.value === "EN")?.value;
const ENGLISH_TARGET = TranslateConst.target.find((it) => it.value === "EN-US")?.value;

// テスト用のguildId（MockSlashCommandで使用される値と一致させる）
const TEST_GUILD_ID = "9999";

/**
 * モック生成のヘルパー関数
 */
interface TranslateCommandParams {
	title: string | null;
	source: string | null | undefined;
	target: string | null | undefined;
}

interface MockSlashCommandOptions {
	withChannel?: boolean;
	replyMessage?: Message;
}

interface SetupTranslateCommandResult {
	commandMock: any;
	message: Message;
	client: Client;
	capturedResult: { content: string };
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
 * translateコマンドのモックを作成する
 * @param params - コマンドパラメータ
 * @param withChannel - チャンネルを含めるか（デフォルト: true）
 * @returns コマンドモック
 */
function createTranslateCommandMock(
	params: TranslateCommandParams,
	withChannel = true,
): any {
	return mockSlashCommand("translate", params, { withChannel });
}

/**
 * Replyキャプチャをセットアップする
 * @param commandMock - コマンドモック
 * @param message - レスポンスメッセージ
 * @returns キャプチャ結果を格納するオブジェクト
 */
function setupReplyCapture(commandMock: any, message: Message): { content: string } {
	const capturedResult = { content: "" };
	
	when(commandMock.reply(anything())).thenCall((arg) => {
		capturedResult.content = arg.content ?? arg;
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
 * Discord interactionイベントを発行する
 * @param client - Discordクライアント
 * @param commandMock - コマンドモック
 */
async function emitTranslateInteractionEvent(
	client: Client,
	commandMock: any,
): Promise<void> {
	client.emit("interactionCreate", instance(commandMock));
}

/**
 * translateコマンドのreply完了を待つ
 * @param commandMock - コマンドモック
 */
async function waitForTranslateReply(commandMock: any): Promise<void> {
	await waitUntilReply(commandMock);
}

/**
 * replyが1回呼ばれたことを検証する
 * @param commandMock - コマンドモック
 */
function verifyReplyCalledOnce(commandMock: any): void {
	verify(commandMock.reply(anything())).once();
}

/**
 * replyが呼ばれなかったことを検証する
 * @param commandMock - コマンドモック
 */
function verifyReplyNotCalled(commandMock: any): void {
	verify(commandMock.reply(anything())).never();
}

/**
 * replyの内容を検証する
 * @param capturedResult - キャプチャされた結果
 * @param expected - 期待する文字列
 * @param matchType - マッチタイプ（'include' または 'equal'）デフォルトは 'include'
 */
function verifyReplyContent(
	capturedResult: { content: string },
	expected: string,
	matchType: "include" | "equal" = "include",
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
	/** チャンネルを含めるか */
	withChannel?: boolean;
	/** 期待するレスポンス内容 */
	expectedContent?: string;
	/** マッチタイプ（'include' または 'equal'） */
	expectedMatchType?: "include" | "equal";
	/** replyが呼ばれるべきか */
	shouldReply?: boolean;
}

/**
 * translateコマンドの実行と検証を一括で行うヘルパー
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
		await new Promise((resolve) => setTimeout(resolve, 500));
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
		// データベース接続を初期化
		const connector = new MysqlConnector();
		// @ts-ignore - privateフィールドにアクセスするため
		connector.instance.options.logging = false;

		// コミュニティデータをクリーンアップ
		await CommunityRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});

		// テスト用のコミュニティを作成
		await CommunityRepositoryImpl.create({
			categoryType: CommunityCategoryType.Discord.getValue(),
			clientId: BigInt(TEST_GUILD_ID),
			batchStatus: 0,
		});
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
