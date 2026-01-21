import { InternalErrorMessage } from "@/src/entities/DiscordErrorMessages";
import { TranslateConst } from "@/src/entities/constants/translate";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityRepositoryImpl } from "@/src/repositories/sequelize-mysql/CommunityRepositoryImpl";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { createMockMessage, mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import { anything, instance, verify, when } from "ts-mockito";

const JAPANESE_SOURCE = TranslateConst.source.find((it) => it.value === "JA")?.value;
const JAPANESE_TARGET = TranslateConst.target.find((it) => it.value === "JA")?.value;
const ENGLISH_SOURCE = TranslateConst.source.find((it) => it.value === "EN")?.value;
const ENGLISH_TARGET = TranslateConst.target.find((it) => it.value === "EN-US")?.value;

// テスト用のguildId（MockSlashCommandで使用される値と一致させる）
const TEST_GUILD_ID = "9999";

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
			const { message } = createMockMessage();
			const commandMock = mockSlashCommand(
				"translate",
				{
					title: "テスト翻訳スレッド",
					source: ENGLISH_SOURCE,
					target: JAPANESE_TARGET,
				},
				{
					withChannel: true,
					replyMessage: message,
				},
			);
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let result = "";
			when(commandMock.reply(anything())).thenCall((arg) => {
				result = arg.content;
				return Promise.resolve(message);
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			expect(result).to.include("ENからJAに翻訳する場を用意したよ！っ");
		});

		/**
		 * [正常系] 日本語から英語への翻訳スレッド作成
		 * - コマンドが正常に実行されることを検証
		 * - 翻訳場の案内メッセージが返されることを検証
		 */
		it("Test /translate title:テスト source:JA target:EN-US", async () => {
			const { message } = createMockMessage();
			const commandMock = mockSlashCommand(
				"translate",
				{
					title: "日英翻訳スレッド",
					source: JAPANESE_SOURCE,
					target: ENGLISH_TARGET,
				},
				{
					withChannel: true,
					replyMessage: message,
				},
			);
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let result = "";
			when(commandMock.reply(anything())).thenCall((arg) => {
				result = arg.content;
				return Promise.resolve(message);
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			expect(result).to.include("JAからEN-USに翻訳する場を用意したよ！っ");
		});

		/**
		 * [エラー系] sourceとtargetが同じ場合
		 * - sourceとtargetが同じ場合にエラーメッセージが返されることを検証
		 */
		it("Test /translate source:JA target:JA (same source and target)", async () => {
			const { message } = createMockMessage();
			const commandMock = mockSlashCommand(
				"translate",
				{
					title: "同一言語テスト",
					source: JAPANESE_SOURCE,
					target: JAPANESE_TARGET,
				},
				{
					withChannel: true,
					replyMessage: message,
				},
			);
			const TEST_CLIENT = await TestDiscordServer.getClient();
			let result = "";
			when(commandMock.reply(anything())).thenCall((arg) => {
				result = arg.content;
				return Promise.resolve(message);
			});

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(anything())).once();
			expect(result).to.equal("sourceとtargetが同じだよ！っ");
		});

		/**
		 * [エラー系] channelがnullの場合
		 * - channelがnullの場合は何も返さずに早期リターンすることを検証
		 * - replyが呼ばれないことを検証
		 */
		it("Test /translate with null channel", async () => {
			const commandMock = mockSlashCommand(
				"translate",
				{
					title: "テスト",
					source: ENGLISH_SOURCE,
					target: JAPANESE_TARGET,
				},
				{
					withChannel: false,
				},
			);
			const TEST_CLIENT = await TestDiscordServer.getClient();

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			// channelがnullの場合は早期リターンするため、少し待ってからverifyする
			await new Promise((resolve) => setTimeout(resolve, 500));
			verify(commandMock.reply(anything())).never();
		});

		/**
		 * [エラー系] titleがnullの場合
		 * - titleが指定されていない場合に内部エラーメッセージが返されることを検証
		 */
		it("Test /translate title:null", async () => {
			const commandMock = mockSlashCommand(
				"translate",
				{
					title: null,
					source: ENGLISH_SOURCE,
					target: JAPANESE_TARGET,
				},
				{
					withChannel: true,
				},
			);
			const TEST_CLIENT = await TestDiscordServer.getClient();

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(InternalErrorMessage)).once();
		});

		/**
		 * [エラー系] sourceがnullの場合
		 * - sourceが指定されていない場合に内部エラーメッセージが返されることを検証
		 */
		it("Test /translate source:null", async () => {
			const commandMock = mockSlashCommand(
				"translate",
				{
					title: "テスト",
					source: null,
					target: JAPANESE_TARGET,
				},
				{
					withChannel: true,
				},
			);
			const TEST_CLIENT = await TestDiscordServer.getClient();

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(InternalErrorMessage)).once();
		});

		/**
		 * [エラー系] targetがnullの場合
		 * - targetが指定されていない場合に内部エラーメッセージが返されることを検証
		 */
		it("Test /translate target:null", async () => {
			const commandMock = mockSlashCommand(
				"translate",
				{
					title: "テスト",
					source: ENGLISH_SOURCE,
					target: null,
				},
				{
					withChannel: true,
				},
			);
			const TEST_CLIENT = await TestDiscordServer.getClient();

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(InternalErrorMessage)).once();
		});

		/**
		 * [エラー系] 全パラメータがnullの場合
		 * - 全パラメータがnullの場合に内部エラーメッセージが返されることを検証
		 */
		it("Test /translate all params null", async () => {
			const commandMock = mockSlashCommand(
				"translate",
				{
					title: null,
					source: null,
					target: null,
				},
				{
					withChannel: true,
				},
			);
			const TEST_CLIENT = await TestDiscordServer.getClient();

			TEST_CLIENT.emit("interactionCreate", instance(commandMock));
			await waitUntilReply(commandMock);
			verify(commandMock.reply(InternalErrorMessage)).once();
		});
	});
});
