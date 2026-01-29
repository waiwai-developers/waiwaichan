import { AppConfig } from "@/src/entities/config/AppConfig";
import { Thread_Exclude_Prefix, Thread_Fetch_Nom } from "@/src/entities/constants/Thread";
import type { ChatAIMessageDto } from "@/src/entities/dto/ChatAIMessageDto";
import { ThreadDto } from "@/src/entities/dto/ThreadDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import { PersonalityId } from "@/src/entities/vo/PersonalityId";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";
import { ThreadMetadata } from "@/src/entities/vo/ThreadMetadata";
import { AIReplyHandler } from "@/src/handlers/discord.js/events/AIReplyHandler";
import type { IChatAILogic } from "@/src/logics/Interfaces/logics/IChatAILogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import { ThreadLogic } from "@/src/logics/ThreadLogic";
import { DiscordTextPresenter } from "@/src/presenter/DiscordTextPresenter";
import { CommunityRepositoryImpl } from "@/src/repositories/sequelize-mysql/CommunityRepositoryImpl";
import { ContextRepositoryImpl } from "@/src/repositories/sequelize-mysql/ContextRepositoryImpl";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { PersonalityContextRepositoryImpl } from "@/src/repositories/sequelize-mysql/PersonalityContextRepositoryImpl";
import { PersonalityRepositoryImpl } from "@/src/repositories/sequelize-mysql/PersonalityRepositoryImpl";
import { ThreadRepositoryImpl } from "@/src/repositories/sequelize-mysql/ThreadRepositoryImpl";
import { mockMessage } from "@/tests/fixtures/discord.js/MockMessage";
import { expect } from "chai";
import { anything, instance, mock, verify, when } from "ts-mockito";

import {
	TEST_BOT_ID,
	TEST_GUILD_ID,
	TEST_THREAD_ID,
	TEST_USER_ID,
	createAIReplyHandlerWithMocks,
	createChannelMock,
	createMessageCollectionMock,
	createTestMetadata,
	createTestThread,
	createTestThreadDto,
	executeAIReplyTest,
	findAllThreads,
	findThreadByMessageId,
	handleAIReplyEvent,
	setupMessageWithChannel,
} from "./TalkHelper.test";

describe("Test Talk Interactions", function (this: Mocha.Suite) {
	// テストのタイムアウト時間を延長（60秒）
	this.timeout(60_000);

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
			} as unknown as JSON,
		});

		// Contextデータの作成
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
			} as unknown as JSON,
		});

		// PersonalityContextデータの作成
		await PersonalityContextRepositoryImpl.create({
			personalityId: PersonalityId.PERSONALITY_ID_WAIWAICHAN.getValue(),
			contextId: 999,
		});
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
		this.timeout(10_000);

		const testOtherThreadId = 67891;
		const testNonChatGPTThreadId = 67892;

		// テスト用のスレッドデータを作成
		await createTestThread();
		await createTestThread({ messageId: testOtherThreadId });
		await createTestThread({
			messageId: Number(testNonChatGPTThreadId),
			categoryType: ThreadCategoryType.CATEGORY_TYPE_DEEPL.getValue(),
		});

		const { handler, threadLogicMock } = createAIReplyHandlerWithMocks();

		// テストケース1: Bot自身の発言を無視できているか
		const botMessageMock = mockMessage(TEST_BOT_ID, false, true);
		when(botMessageMock.channel).thenReturn({
			isThread: () => true,
			communityId: 1,
			id: TEST_THREAD_ID,
			ownerId: TEST_BOT_ID,
			sendTyping: () => Promise.resolve(),
			messages: {
				fetch: () => Promise.resolve([]),
			},
		} as any);

		await handleAIReplyEvent(handler, botMessageMock);
		verify(botMessageMock.reply(anything())).never();

		// テストケース2: スレッド以外のチャンネルからのメッセージが無視されるか
		const { messageMock: nonThreadMessageMock } = setupMessageWithChannel({
			isThread: false,
			threadId: "12345",
		});

		await handleAIReplyEvent(handler, nonThreadMessageMock);
		verify(nonThreadMessageMock.reply(anything())).never();

		// テストケース3: 他ユーザーが所有するスレッドが除外対象になるか
		const { messageMock: otherOwnerMessageMock } = setupMessageWithChannel({
			threadId: String(testOtherThreadId),
			ownerId: TEST_USER_ID,
		});

		await handleAIReplyEvent(handler, otherOwnerMessageMock);
		verify(otherOwnerMessageMock.reply(anything())).never();

		// テストケース4: カスタムカテゴリ（CHATGPT以外）のスレッドで無視されるか
		when(threadLogicMock.find(anything(), anything())).thenResolve(
			createTestThreadDto({
				messageId: Number(testNonChatGPTThreadId),
				categoryType: ThreadCategoryType.CATEGORY_TYPE_DEEPL,
			}),
		);

		const { messageMock: nonChatGPTMessageMock } = setupMessageWithChannel({
			threadId: String(testNonChatGPTThreadId),
		});

		await handleAIReplyEvent(handler, nonChatGPTMessageMock);
		verify(nonChatGPTMessageMock.reply(anything())).never();
	});

	/**
	 * [ThreadExcludePrefix] 除外プレフィックスの検証
	 * - ';' を付けたメッセージには反応しないか
	 */
	it("test semicolon-prefixed messages are ignored", async function (this: Mocha.Context) {
		this.timeout(10_000);

		await createTestThread();

		const { chatAILogicMock, messageMock } = await executeAIReplyTest({
			content: `${Thread_Exclude_Prefix}無視してほしいメッセージ`,
			threadDto: createTestThreadDto(),
		});

		verify(chatAILogicMock.replyTalk(anything(), anything())).never();
		verify(messageMock.reply(anything())).never();
	});

	/**
	 * [ThreadExcludePrefix] 除外プレフィックスの検証
	 * - 履歴取得時に ';' 付きメッセージがコンテキストに含まれないか
	 */
	it("test semicolon-prefixed messages are excluded from context history", async function (this: Mocha.Context) {
		this.timeout(10_000);

		await createTestThread();

		const messageHistory = [
			{ id: "msg1", author: { bot: false, id: TEST_USER_ID }, content: "こんにちは" },
			{ id: "msg2", author: { bot: false, id: TEST_USER_ID }, content: `${Thread_Exclude_Prefix}除外メッセージ` },
			{ id: "msg3", author: { bot: true, id: TEST_BOT_ID }, content: "前回の応答" },
			{ id: "msg4", author: { bot: false, id: TEST_USER_ID }, content: "質問です" },
		];

		const { chatAILogicMock, messageMock } = await executeAIReplyTest({
			content: "質問です",
			messageHistory,
			threadDto: createTestThreadDto(),
			replyCallback: (prompt, context) => {
				const contents = context.map((entry: ChatAIMessageDto) => entry.content.getValue());
				expect(contents).to.deep.equal(["こんにちは", "前回の応答", "質問です"]);
				return Promise.resolve("テスト応答");
			},
		});

		verify(chatAILogicMock.replyTalk(anything(), anything())).once();
		verify(messageMock.reply(anything())).once();
	});

	it("should ignore messages starting with exclude prefix in talk threads", async function (this: Mocha.Context) {
		this.timeout(10_000);

		await createTestThread();

		const { chatAILogicMock, messageMock, channelMock } = await executeAIReplyTest({
			content: `${Thread_Exclude_Prefix}除外メッセージ`,
			threadDto: createTestThreadDto(),
		});

		verify(chatAILogicMock.replyTalk(anything(), anything())).never();
		verify(messageMock.reply(anything())).never();
		verify(channelMock.sendTyping()).never();
	});

	it("should exclude prefixed messages from talk history context", async function (this: Mocha.Context) {
		this.timeout(10_000);

		await createTestThread();

		const testMessageHistory = [
			{ id: "msg1", author: { bot: false, id: TEST_USER_ID }, content: "ユーザーメッセージ1" },
			{ id: "msg2", author: { bot: false, id: TEST_USER_ID }, content: `${Thread_Exclude_Prefix}除外メッセージ` },
			{ id: "msg3", author: { bot: true, id: TEST_BOT_ID }, content: "ボットメッセージ" },
		];

		const { chatAILogicMock } = await executeAIReplyTest({
			content: "通常メッセージ",
			messageHistory: testMessageHistory,
			threadDto: createTestThreadDto(),
			replyCallback: (prompt, context) => {
				expect(context).to.be.an("array").with.lengthOf(2);
				expect(context[0].content.getValue()).to.equal("ユーザーメッセージ1");
				expect(context[1].content.getValue()).to.equal("ボットメッセージ");
				return Promise.resolve("テスト応答");
			},
		});

		verify(chatAILogicMock.replyTalk(anything(), anything())).once();
	});

	/**
	 * [ThreadSearch] スレッド検索機能の検証
	 * - ThreadLogic.find が適切な引数で呼ばれるか
	 * - CommunityId および ThreadMessageId が正しい形式で生成されるか
	 * - 対象スレッドが存在しないケースでのハンドリングが正しいか
	 */
	it("test ThreadLogic.find functionality", async function (this: Mocha.Context) {
		this.timeout(10_000);

		const testGuildId = 12345;
		const testThreadId = 67890;
		const testNonExistThreadId = 99999;
		const testUserId = 98765;

		await createTestThread({ messageId: testThreadId });

		// ThreadLogicのインスタンスを作成
		const threadLogic = new ThreadLogic();
		// @ts-ignore - privateフィールドにアクセスするため
		const threadRepositoryMock = mock<any>();
		// @ts-ignore - privateフィールドにアクセスするため
		threadLogic.threadRepository = instance(threadRepositoryMock);
		// @ts-ignore - privateフィールドにアクセスするため
		threadLogic.transaction = {
			startTransaction: async (callback: () => Promise<any>) => {
				return await callback();
			},
		};

		// 正常系: 存在するスレッドを検索
		when(threadRepositoryMock.findByMessageId(anything(), anything())).thenCall(async (communityId: CommunityId, messageId: ThreadMessageId) => {
			expect(communityId.getValue()).to.equal(1);
			expect(Number(messageId.getValue())).to.equal(testThreadId);

			return await ThreadRepositoryImpl.findOne({
				where: {
					communityId: 1,
					messageId: messageId.getValue(),
				},
			}).then((res) => (res ? res.toDto() : undefined));
		});

		const foundThread = await threadLogic.find(new CommunityId(1), new ThreadMessageId(Number(testThreadId)));

		expect(foundThread).to.not.be.undefined;
		if (foundThread) {
			expect(foundThread.communityId.getValue()).to.equal(1);
			expect(Number(foundThread.messageId.getValue())).to.equal(testThreadId);
			expect(foundThread.categoryType.getValue()).to.equal(ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue());

			const metadata = foundThread.metadata.getValue();
			expect(metadata).to.have.property("persona_role", "テスト役割");
			expect(metadata).to.have.property("speaking_style_rules", "テストスタイル");
		}

		// 異常系: 存在しないスレッドを検索
		when(threadRepositoryMock.findByMessageId(anything(), anything())).thenCall(async (communityId: CommunityId, messageId: ThreadMessageId) => {
			expect(communityId.getValue()).to.equal(1);
			expect(Number(messageId.getValue())).to.equal(testNonExistThreadId);
			return undefined;
		});

		const notFoundThread = await threadLogic.find(new CommunityId(1), new ThreadMessageId(Number(testNonExistThreadId)));
		expect(notFoundThread).to.be.undefined;

		// ThreadGuildIdとThreadMessageIdの生成と検証
		const guildId = new CommunityId(testGuildId);
		const messageId = new ThreadMessageId(Number(testThreadId));

		expect(Number(guildId.getValue())).to.equal(testGuildId);
		expect(Number(messageId.getValue())).to.equal(testThreadId);
	});

	/**
	 * [TypingIndicator] タイピング表示の検証
	 * - sendTyping が正しく呼ばれているか
	 */
	it("test typing indicator is shown at appropriate timing", async function (this: Mocha.Context) {
		this.timeout(10_000);

		await createTestThread();

		const { handler, threadLogicMock, chatAILogicMock } = createAIReplyHandlerWithMocks({
			threadDto: createTestThreadDto(),
			replyResponse: "テスト応答",
		});

		const messageHistory = [{ id: "msg1", author: { bot: false, id: TEST_USER_ID }, content: "こんにちは" }];

		const { messageMock, channelMock } = setupMessageWithChannel({
			messageCollection: createMessageCollectionMock(messageHistory),
		});

		await handleAIReplyEvent(handler, messageMock);

		verify(channelMock.sendTyping()).once();
		verify(threadLogicMock.find(anything(), anything())).once();
		verify(chatAILogicMock.replyTalk(anything(), anything())).once();
		verify(messageMock.reply(anything())).once();
	});

	/**
	 * [MessageHistory] メッセージ履歴取得と変換の検証
	 */
	it("test message history retrieval and conversion", async function (this: Mocha.Context) {
		this.timeout(10_000);

		const testGuildId = "12345";
		const testThreadId = 67890;
		const testUserId = "98765";
		const testBotId = AppConfig.discord.clientId;

		await createTestThread({ messageId: testThreadId });

		const { handler: aiReplyHandler, chatAILogicMock } = createAIReplyHandlerWithMocks({
			threadDto: new ThreadDto(
				new CommunityId(1),
				new ThreadMessageId(Number(testThreadId)),
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
			replyResponse: "テスト応答",
		});

		const mockMessages = [
			{ id: "msg5", author: { bot: false, id: testUserId }, content: "ユーザーメッセージ5" },
			{ id: "msg4", author: { bot: true, id: testBotId }, content: "ボットメッセージ4" },
			{ id: "msg3", author: { bot: false, id: testUserId }, content: "ユーザーメッセージ3" },
			{ id: "msg2", author: { bot: true, id: testBotId }, content: "ボットメッセージ2" },
			{ id: "msg1", author: { bot: false, id: testUserId }, content: "ユーザーメッセージ1" },
		];

		const messageMock = mockMessage(testUserId);
		const channelMock = mock<any>();
		when(channelMock.isThread()).thenReturn(true);
		when(channelMock.guildId).thenReturn(testGuildId);
		when(channelMock.id).thenReturn(testThreadId);
		when(channelMock.ownerId).thenReturn(testBotId);
		when(channelMock.sendTyping()).thenResolve();

		const messageCollection = {
			reverse: () => [...mockMessages].reverse(),
			map: function (callback: any) {
				return this.reverse().map(callback);
			},
		};

		when(channelMock.messages).thenReturn({
			fetch: (options: any) => {
				expect(options).to.deep.equal({ limit: 21 });
				return Promise.resolve(messageCollection);
			},
		});

		when(messageMock.channel).thenReturn(instance(channelMock));
		when(messageMock.reply(anything())).thenResolve();

		await aiReplyHandler.handle(instance(messageMock));

		verify(chatAILogicMock.replyTalk(anything(), anything())).once();
		verify(messageMock.reply(anything())).once();
	});

	/**
	 * [ChatAIIntegration] ChatAILogicとの連携テスト
	 */
	it("test ChatAILogic integration with thread metadata and message history", async function (this: Mocha.Context) {
		this.timeout(10_000);

		const testGuildId = "12345";
		const testThreadId = 67890;
		const testUserId = "98765";
		const testBotId = AppConfig.discord.clientId;

		const testMetadata = {
			persona_role: "テスト役割",
			speaking_style_rules: "テストスタイル",
			response_directives: "テスト指示",
			emotion_model: "テスト感情",
			notes: "テスト注釈",
			input_scope: "テスト範囲",
		};

		await createTestThread({ messageId: Number(testThreadId), metadata: testMetadata });

		const { handler: aiReplyHandler, chatAILogicMock } = createAIReplyHandlerWithMocks({
			threadDto: createTestThreadDto({ messageId: Number(testThreadId), metadata: testMetadata }),
			replyCallback: (prompt, context) => {
				const promptValue = (prompt as any).getValue();
				expect(promptValue).to.deep.equal(testMetadata);
				expect(context).to.be.an("array").with.lengthOf(3);
				expect(context[0].role.getValue()).to.equal("user");
				expect(context[0].content.getValue()).to.equal("ユーザーメッセージ1");
				expect(context[1].role.getValue()).to.equal("assistant");
				expect(context[1].content.getValue()).to.equal("ボットメッセージ1");
				expect(context[2].role.getValue()).to.equal("user");
				expect(context[2].content.getValue()).to.equal("ユーザーメッセージ2");
				return Promise.resolve("テスト応答");
			},
		});

		const testMessageHistory = [
			{ id: "msg1", author: { bot: false, id: testUserId }, content: "ユーザーメッセージ1" },
			{ id: "msg2", author: { bot: true, id: testBotId }, content: "ボットメッセージ1" },
			{ id: "msg3", author: { bot: false, id: testUserId }, content: "ユーザーメッセージ2" },
		];

		const { messageMock } = setupMessageWithChannel({
			userId: testUserId,
			threadId: String(testThreadId),
			messageCollection: createMessageCollectionMock(testMessageHistory),
		});

		await aiReplyHandler.handle(instance(messageMock));

		verify(chatAILogicMock.replyTalk(anything(), anything())).once();
		verify(messageMock.reply("テスト応答")).once();
	});

	/**
	 * [PresenterIntegration] DiscordTextPresenterとの連携検証
	 */
	it("test DiscordTextPresenter integration with ChatAILogic output", async function (this: Mocha.Context) {
		this.timeout(10_000);

		const shortText = "これは短いテキストです。ChatAILogicからの応答です。";
		const longText = `${"これはテスト用の長いテキストです。".repeat(150)}`;

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
		const codeBlockText =
			"これはテスト用のテキストです。\n```\nfunction test() {\n  console.log('hello');\n}\n```\nコードブロックの後のテキストです。";
		const codeBlockTextResult = await DiscordTextPresenter(codeBlockText);
		expect(codeBlockTextResult).to.be.an("array");

		const hasIntactCodeBlock = codeBlockTextResult.some((chunk) => chunk.includes("```\nfunction test()") && chunk.includes("}\n```"));
		expect(hasIntactCodeBlock).to.be.true;
	});

	/**
	 * [ErrorHandling] エラー処理の堅牢性
	 */
	it("test error handling robustness", async function (this: Mocha.Context) {
		this.timeout(10_000);

		const testMetadata = {
			persona_role: "テスト役割",
			speaking_style_rules: "テストスタイル",
			response_directives: "テスト指示",
			emotion_model: "テスト感情",
			notes: "テスト注釈",
			input_scope: "テスト範囲",
		};

		await createTestThread({ messageId: TEST_THREAD_ID, metadata: testMetadata });

		const testMessageHistory = [{ id: "msg1", author: { bot: false, id: TEST_USER_ID }, content: "こんにちは" }];

		const { handler: aiReplyHandler } = createAIReplyHandlerWithMocks({
			threadDto: new ThreadDto(
				new CommunityId(1),
				new ThreadMessageId(TEST_THREAD_ID),
				ThreadCategoryType.CATEGORY_TYPE_CHATGPT,
				new ThreadMetadata(testMetadata as unknown as JSON),
			),
			replyThrowError: new Error("ChatAI応答生成エラー"),
		});

		const { messageMock } = setupMessageWithChannel({
			messageCollection: createMessageCollectionMock(testMessageHistory),
		});

		let error = null;
		try {
			await aiReplyHandler.handle(instance(messageMock));
		} catch (e) {
			error = e;
		}
		expect(error).to.be.null;

		verify(messageMock.reply("ごめんね！っ、応答の生成中にエラーが発生したよ！！っ。")).once();
	});

	/**
	 * [Validation] 入力値に関する異常系テスト - 空メッセージ
	 */
	it("test empty message handling", async function (this: Mocha.Context) {
		this.timeout(10_000);

		await createTestThread({ messageId: TEST_THREAD_ID });

		const { chatAILogicMock } = await executeAIReplyTest({
			content: "",
			threadDto: createTestThreadDto(),
			replyResponse: "何か質問や話したいことがあれば、お気軽に話しかけてね！",
		});

		verify(chatAILogicMock.replyTalk(anything(), anything())).once();
	});

	/**
	 * [Validation] 入力値に関する異常系テスト - 特殊文字とMarkdown
	 */
	it("test special characters and markdown handling", async function (this: Mocha.Context) {
		this.timeout(10_000);

		await createTestThread({ messageId: TEST_THREAD_ID });

		const specialCharContent = "# タイトル\n**太字**\n```コード```\n絵文字: 😀 🎉";

		const { chatAILogicMock } = await executeAIReplyTest({
			content: specialCharContent,
			messageHistory: [{ id: "msg1", author: { bot: false, id: TEST_USER_ID }, content: specialCharContent }],
			threadDto: createTestThreadDto(),
			replyCallback: (prompt, context) => {
				expect(context[0].content.getValue()).to.equal(specialCharContent);
				return Promise.resolve("特殊文字とMarkdownを含むメッセージを受け取りました。");
			},
		});

		verify(chatAILogicMock.replyTalk(anything(), anything())).once();
	});

	/**
	 * [Validation] 入力値に関する異常系テスト - 長文メッセージ
	 */
	it("test long message handling", async function (this: Mocha.Context) {
		this.timeout(10_000);

		await createTestThread({ messageId: TEST_THREAD_ID });

		const longContent = "これは長文メッセージのテストです。".repeat(100);

		const { chatAILogicMock } = await executeAIReplyTest({
			content: longContent,
			messageHistory: [{ id: "msg1", author: { bot: false, id: TEST_USER_ID }, content: longContent }],
			threadDto: createTestThreadDto(),
			replyCallback: (prompt, context) => {
				expect(context[0].content.getValue()).to.equal(longContent);
				expect(context[0].content.getValue().length).to.be.at.least(1000);
				return Promise.resolve(`長文メッセージを受け取りました。${"応答の一部です。".repeat(50)}`);
			},
		});

		verify(chatAILogicMock.replyTalk(anything(), anything())).once();
	});
});
