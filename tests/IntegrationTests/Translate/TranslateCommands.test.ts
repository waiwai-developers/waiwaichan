import {
	ENGLISH_SOURCE,
	ENGLISH_TARGET,
	JAPANESE_SOURCE,
	JAPANESE_TARGET,
	executeAndVerifyTranslateCommand,
	setupTestDatabase,
} from "./TranslateHelpers.test";

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
					expectedContent: "内部エラーが発生したよ！っ",
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
					expectedContent: "内部エラーが発生したよ！っ",
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
					expectedContent: "内部エラーが発生したよ！っ",
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
					expectedContent: "内部エラーが発生したよ！っ",
					expectedMatchType: "equal",
				},
			);
		});
	});
});
