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

/**
 * translateコマンドのモックをセットアップする共通関数
 */
async function setupTranslateCommand(
	params: TranslateCommandParams,
	options: MockSlashCommandOptions = {},
): Promise<SetupTranslateCommandResult> {
	const { message } = createMockMessage();
	const commandMock = mockSlashCommand("translate", params, {
		withChannel: options.withChannel ?? true,
		replyMessage: options.replyMessage ?? message,
	});
	const client = await TestDiscordServer.getClient();
	const capturedResult = { content: "" };

	when(commandMock.reply(anything())).thenCall((arg) => {
		capturedResult.content = arg.content ?? arg;
		return Promise.resolve(message);
	});

	return { commandMock, message, client, capturedResult };
}

/**
 * translateコマンドを実行して結果を取得する共通関数
 */
async function executeTranslateCommand(
	client: Client,
	commandMock: any,
): Promise<void> {
	client.emit("interactionCreate", instance(commandMock));
	await waitUntilReply(commandMock);
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
			const { commandMock, client, capturedResult } = await setupTranslateCommand({
				title: "テスト翻訳スレッド",
				source: ENGLISH_SOURCE,
				target: JAPANESE_TARGET,
			});

			await executeTranslateCommand(client, commandMock);
			verify(commandMock.reply(anything())).once();
			expect(capturedResult.content).to.include("ENからJAに翻訳する場を用意したよ！っ");
		});

		/**
		 * [正常系] 日本語から英語への翻訳スレッド作成
		 * - コマンドが正常に実行されることを検証
		 * - 翻訳場の案内メッセージが返されることを検証
		 */
		it("Test /translate title:テスト source:JA target:EN-US", async () => {
			const { commandMock, client, capturedResult } = await setupTranslateCommand({
				title: "日英翻訳スレッド",
				source: JAPANESE_SOURCE,
				target: ENGLISH_TARGET,
			});

			await executeTranslateCommand(client, commandMock);
			verify(commandMock.reply(anything())).once();
			expect(capturedResult.content).to.include("JAからEN-USに翻訳する場を用意したよ！っ");
		});

		/**
		 * [エラー系] sourceとtargetが同じ場合
		 * - sourceとtargetが同じ場合にエラーメッセージが返されることを検証
		 */
		it("Test /translate source:JA target:JA (same source and target)", async () => {
			const { commandMock, client, capturedResult } = await setupTranslateCommand({
				title: "同一言語テスト",
				source: JAPANESE_SOURCE,
				target: JAPANESE_TARGET,
			});

			await executeTranslateCommand(client, commandMock);
			verify(commandMock.reply(anything())).once();
			expect(capturedResult.content).to.equal("sourceとtargetが同じだよ！っ");
		});

		/**
		 * [エラー系] channelがnullの場合
		 * - channelがnullの場合は何も返さずに早期リターンすることを検証
		 * - replyが呼ばれないことを検証
		 */
		it("Test /translate with null channel", async () => {
			const { commandMock, client } = await setupTranslateCommand(
				{
					title: "テスト",
					source: ENGLISH_SOURCE,
					target: JAPANESE_TARGET,
				},
				{ withChannel: false },
			);

			client.emit("interactionCreate", instance(commandMock));
			// channelがnullの場合は早期リターンするため、少し待ってからverifyする
			await new Promise((resolve) => setTimeout(resolve, 500));
			verify(commandMock.reply(anything())).never();
		});

		/**
		 * [エラー系] titleがnullの場合
		 * - titleが指定されていない場合に内部エラーメッセージが返されることを検証
		 */
		it("Test /translate title:null", async () => {
			const { commandMock, client } = await setupTranslateCommand({
				title: null,
				source: ENGLISH_SOURCE,
				target: JAPANESE_TARGET,
			});

			await executeTranslateCommand(client, commandMock);
			verify(commandMock.reply(InternalErrorMessage)).once();
		});

		/**
		 * [エラー系] sourceがnullの場合
		 * - sourceが指定されていない場合に内部エラーメッセージが返されることを検証
		 */
		it("Test /translate source:null", async () => {
			const { commandMock, client } = await setupTranslateCommand({
				title: "テスト",
				source: null,
				target: JAPANESE_TARGET,
			});

			await executeTranslateCommand(client, commandMock);
			verify(commandMock.reply(InternalErrorMessage)).once();
		});

		/**
		 * [エラー系] targetがnullの場合
		 * - targetが指定されていない場合に内部エラーメッセージが返されることを検証
		 */
		it("Test /translate target:null", async () => {
			const { commandMock, client } = await setupTranslateCommand({
				title: "テスト",
				source: ENGLISH_SOURCE,
				target: null,
			});

			await executeTranslateCommand(client, commandMock);
			verify(commandMock.reply(InternalErrorMessage)).once();
		});

		/**
		 * [エラー系] 全パラメータがnullの場合
		 * - 全パラメータがnullの場合に内部エラーメッセージが返されることを検証
		 */
		it("Test /translate all params null", async () => {
			const { commandMock, client } = await setupTranslateCommand({
				title: null,
				source: null,
				target: null,
			});

			await executeTranslateCommand(client, commandMock);
			verify(commandMock.reply(InternalErrorMessage)).once();
		});
	});
});
