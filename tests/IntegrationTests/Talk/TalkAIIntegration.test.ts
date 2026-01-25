import { AppConfig } from "@/src/entities/config/AppConfig";
import { Thread_Fetch_Nom } from "@/src/entities/constants/Thread";
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
	createMessageCollectionMock,
	createTestMetadata,
	createTestThread,
	createTestThreadDto,
	executeAIReplyTest,
	findThreadByMessageId,
	setupMessageWithChannel,
} from "./TalkTestHelpers";

describe("Talk AI Integration Tests", function (this: Mocha.Suite) {
	this.timeout(60_000);

	beforeEach(async () => {
		const connector = new MysqlConnector();
		// @ts-ignore
		connector.instance.options.logging = false;

		await CommunityRepositoryImpl.destroy({ truncate: true, force: true });
		await CommunityRepositoryImpl.create({
			categoryType: CommunityCategoryType.Discord.getValue(),
			clientId: BigInt(TEST_GUILD_ID),
			batchStatus: 0,
		});

		await ThreadRepositoryImpl.destroy({ truncate: true, force: true });
		await PersonalityContextRepositoryImpl.destroy({ truncate: true, force: true });
		await ContextRepositoryImpl.destroy({ truncate: true, force: true });
		await PersonalityRepositoryImpl.destroy({ truncate: true, force: true });

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

		await PersonalityContextRepositoryImpl.create({
			personalityId: PersonalityId.PERSONALITY_ID_WAIWAICHAN.getValue(),
			contextId: 999,
		});
	});

	/**
	 * ThreadLogic.find機能の検証
	 */
	it("test ThreadLogic.find functionality", async function (this: Mocha.Context) {
		this.timeout(10_000);

		const testThreadId = 67890;
		const testNonExistThreadId = 99999;

		await createTestThread({ messageId: testThreadId.toString() });

		const threadLogic = new ThreadLogic();
		// @ts-ignore
		const threadRepositoryMock = mock<ThreadRepositoryImpl>();
		// @ts-ignore
		threadLogic.threadRepository = instance(threadRepositoryMock);
		// @ts-ignore
		threadLogic.transaction = {
			startTransaction: async (callback: () => Promise<any>) => {
				return await callback();
			},
		};

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

		const foundThread = await threadLogic.find(new CommunityId(1), new ThreadMessageId(testThreadId.toString()));

		expect(foundThread).to.not.be.undefined;
		if (foundThread) {
			expect(foundThread.communityId.getValue()).to.equal(1);
			expect(Number(foundThread.messageId.getValue())).to.equal(testThreadId);
			expect(foundThread.categoryType.getValue()).to.equal(ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue());
		}

		when(threadRepositoryMock.findByMessageId(anything(), anything())).thenCall(async (communityId: CommunityId, messageId: ThreadMessageId) => {
			expect(communityId.getValue()).to.equal(1);
			expect(Number(messageId.getValue())).to.equal(testNonExistThreadId);
			return undefined;
		});

		const notFoundThread = await threadLogic.find(new CommunityId(1), new ThreadMessageId(testNonExistThreadId.toString()));
		expect(notFoundThread).to.be.undefined;
	});

	/**
	 * タイピング表示の検証
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

		await handler.handle(instance(messageMock));

		verify(channelMock.sendTyping()).once();
		verify(threadLogicMock.find(anything(), anything())).once();
		verify(chatAILogicMock.replyTalk(anything(), anything())).once();
		verify(messageMock.reply(anything())).once();
	});

	/**
	 * メッセージ履歴取得と変換の検証
	 */
	it("test message history retrieval and conversion", async function (this: Mocha.Context) {
		this.timeout(10_000);

		await createTestThread({ messageId: TEST_THREAD_ID });

		const aiReplyHandler = new AIReplyHandler();
		const communityLogicMock = mock<ICommunityLogic>();
		// @ts-ignore
		aiReplyHandler.CommunityLogic = instance(communityLogicMock);
		when(communityLogicMock.getId(anything())).thenResolve(new CommunityId(1));

		const threadLogicMock = mock<ThreadLogic>();
		// @ts-ignore
		aiReplyHandler.threadLogic = instance(threadLogicMock);

		when(threadLogicMock.find(anything(), anything())).thenResolve(
			new ThreadDto(
				new CommunityId(1),
				new ThreadMessageId(TEST_THREAD_ID),
				ThreadCategoryType.CATEGORY_TYPE_CHATGPT,
				new ThreadMetadata(createTestMetadata() as unknown as JSON),
			),
		);

		const chatAILogicMock = mock<IChatAILogic>();
		// @ts-ignore
		aiReplyHandler.chatAILogic = instance(chatAILogicMock);
		when(chatAILogicMock.replyTalk(anything(), anything())).thenResolve("テスト応答");

		const mockMessages = [
			{ id: "msg5", author: { bot: false, id: TEST_USER_ID }, content: "ユーザーメッセージ5" },
			{ id: "msg4", author: { bot: true, id: TEST_BOT_ID }, content: "ボットメッセージ4" },
			{ id: "msg3", author: { bot: false, id: TEST_USER_ID }, content: "ユーザーメッセージ3" },
			{ id: "msg2", author: { bot: true, id: TEST_BOT_ID }, content: "ボットメッセージ2" },
			{ id: "msg1", author: { bot: false, id: TEST_USER_ID }, content: "ユーザーメッセージ1" },
		];

		const messageMock = mockMessage(TEST_USER_ID);
		const channelMock = mock<any>();
		when(channelMock.isThread()).thenReturn(true);
		when(channelMock.guildId).thenReturn(TEST_GUILD_ID);
		when(channelMock.id).thenReturn(TEST_THREAD_ID);
		when(channelMock.ownerId).thenReturn(TEST_BOT_ID);
		when(channelMock.sendTyping()).thenResolve();

		const messageCollection = {
			reverse: () => [...mockMessages].reverse(),
			map: function (callback: any) {
				return this.reverse().map(callback);
			},
		};

		when(channelMock.messages).thenReturn({
			fetch: (options: any) => {
				expect(options).to.deep.equal({ limit: Thread_Fetch_Nom });
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
	 * ChatAILogic統合テスト
	 */
	it("test ChatAILogic integration with thread metadata and message history", async function (this: Mocha.Context) {
		this.timeout(10_000);

		const testMetadata = createTestMetadata();
		await createTestThread({ messageId: TEST_THREAD_ID, metadata: testMetadata });

		const aiReplyHandler = new AIReplyHandler();
		const communityLogicMock = mock<ICommunityLogic>();
		// @ts-ignore
		aiReplyHandler.CommunityLogic = instance(communityLogicMock);
		when(communityLogicMock.getId(anything())).thenResolve(new CommunityId(1));

		const threadLogicMock = mock<ThreadLogic>();
		// @ts-ignore
		aiReplyHandler.threadLogic = instance(threadLogicMock);
		when(threadLogicMock.find(anything(), anything())).thenResolve(createTestThreadDto({ messageId: TEST_THREAD_ID, metadata: testMetadata }));

		const chatAILogicMock = mock<IChatAILogic>();
		// @ts-ignore
		aiReplyHandler.chatAILogic = instance(chatAILogicMock);

		const testMessageHistory = [
			{ id: "msg1", author: { bot: false, id: TEST_USER_ID }, content: "ユーザーメッセージ1" },
			{ id: "msg2", author: { bot: true, id: TEST_BOT_ID }, content: "ボットメッセージ1" },
			{ id: "msg3", author: { bot: false, id: TEST_USER_ID }, content: "ユーザーメッセージ2" },
			{ id: "msg4", author: { bot: true, id: TEST_BOT_ID }, content: "ボットメッセージ2" },
			{ id: "msg5", author: { bot: false, id: TEST_USER_ID }, content: "ユーザーメッセージ3" },
		];

		const messageCollection = {
			reverse: () => testMessageHistory,
			map: function (callback: any) {
				return this.reverse().map(callback);
			},
		};

		const messageMock = mockMessage(TEST_USER_ID);
		const channelMock = mock<any>();
		when(channelMock.isThread()).thenReturn(true);
		when(channelMock.guildId).thenReturn(TEST_GUILD_ID);
		when(channelMock.id).thenReturn(TEST_THREAD_ID);
		when(channelMock.ownerId).thenReturn(TEST_BOT_ID);
		when(channelMock.sendTyping()).thenResolve();
		when(channelMock.messages).thenReturn({
			fetch: (options: any) => {
				expect(options).to.deep.equal({ limit: Thread_Fetch_Nom });
				return Promise.resolve(messageCollection);
			},
		});

		when(messageMock.channel).thenReturn(instance(channelMock));
		when(messageMock.reply(anything())).thenResolve();

		when(chatAILogicMock.replyTalk(anything(), anything())).thenCall((prompt, context) => {
			const promptValue = prompt.getValue();
			expect(promptValue).to.deep.equal(testMetadata);

			expect(context).to.be.an("array").with.lengthOf(5);
			expect(context[0].role.getValue()).to.equal("user");
			expect(context[0].content.getValue()).to.equal("ユーザーメッセージ1");

			return Promise.resolve("テスト応答");
		});

		await aiReplyHandler.handle(instance(messageMock));

		verify(chatAILogicMock.replyTalk(anything(), anything())).once();
		verify(messageMock.reply("テスト応答")).once();
	});

	/**
	 * DiscordTextPresenter統合テスト
	 */
	it("test DiscordTextPresenter integration with ChatAILogic output", async function (this: Mocha.Context) {
		this.timeout(10_000);

		const shortText = "これは短いテキストです。";
		const longText = `${"これはテスト用の長いテキストです。".repeat(100)}\`\`\`\nコードブロックも含まれています\n\`\`\`${"さらに長いテキストが続きます。".repeat(50)}`;

		const shortTextResult = await DiscordTextPresenter(shortText);
		expect(shortTextResult).to.be.an("array");
		expect(shortTextResult.length).to.equal(1);
		expect(shortTextResult[0]).to.equal(shortText);

		const longTextResult = await DiscordTextPresenter(longText);
		expect(longTextResult).to.be.an("array");
		expect(longTextResult.length).to.be.greaterThan(1);

		const codeBlockText =
			"これはテスト用のテキストです。\n```\nfunction test() {\n  console.log('hello');\n}\n```\nコードブロックの後のテキストです。";
		const codeBlockTextResult = await DiscordTextPresenter(codeBlockText);
		expect(codeBlockTextResult).to.be.an("array");

		const hasIntactCodeBlock = codeBlockTextResult.some((chunk) => chunk.includes("```\nfunction test()") && chunk.includes("}\n```"));
		expect(hasIntactCodeBlock).to.be.true;
	});

	/**
	 * エラーハンドリングの堅牢性テスト
	 */
	it("test error handling robustness", async function (this: Mocha.Context) {
		this.timeout(10_000);

		const testMetadata = createTestMetadata();
		await createTestThread({ messageId: TEST_THREAD_ID, metadata: testMetadata });

		const aiReplyHandler = new AIReplyHandler();
		const communityLogicMock = mock<ICommunityLogic>();
		// @ts-ignore
		aiReplyHandler.CommunityLogic = instance(communityLogicMock);
		when(communityLogicMock.getId(anything())).thenResolve(new CommunityId(1));

		const chatAILogicMock = mock<IChatAILogic>();
		// @ts-ignore
		aiReplyHandler.chatAILogic = instance(chatAILogicMock);

		const testMessageHistory = [{ id: "msg1", author: { bot: false, id: TEST_USER_ID }, content: "こんにちは" }];

		const messageCollection = {
			reverse: () => testMessageHistory,
			map: function (callback: any) {
				return this.reverse().map(callback);
			},
		};

		const messageMock = mockMessage(TEST_USER_ID);
		const channelMock = mock<any>();
		when(channelMock.isThread()).thenReturn(true);
		when(channelMock.guildId).thenReturn(TEST_GUILD_ID);
		when(channelMock.id).thenReturn(TEST_THREAD_ID);
		when(channelMock.ownerId).thenReturn(TEST_BOT_ID);
		when(channelMock.sendTyping()).thenResolve();
		when(channelMock.messages).thenReturn({
			fetch: () => Promise.resolve(messageCollection),
		});

		when(messageMock.channel).thenReturn(instance(channelMock));

		const threadLogicMock = mock<ThreadLogic>();
		// @ts-ignore
		aiReplyHandler.threadLogic = instance(threadLogicMock);
		when(threadLogicMock.find(anything(), anything())).thenResolve(
			new ThreadDto(
				new CommunityId(1),
				new ThreadMessageId(TEST_THREAD_ID),
				ThreadCategoryType.CATEGORY_TYPE_CHATGPT,
				new ThreadMetadata(testMetadata as unknown as JSON),
			),
		);

		// テストケース1: ChatAILogic.replyTalkが例外をスロー
		when(chatAILogicMock.replyTalk(anything(), anything())).thenThrow(new Error("ChatAI応答生成エラー"));
		when(messageMock.reply(anything())).thenResolve();

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
	 * 入力値バリデーションテスト
	 */
	it("test empty message handling", async function (this: Mocha.Context) {
		this.timeout(10_000);

		await createTestThread({ messageId: TEST_THREAD_ID });

		const { chatAILogicMock } = await executeAIReplyTest({
			content: "",
			threadDto: createTestThreadDto(),
			replyCallback: (prompt, context) => {
				expect(context).to.be.an("array");
				return Promise.resolve("何か質問や話したいことがあれば、お気軽に話しかけてね！");
			},
		});

		verify(chatAILogicMock.replyTalk(anything(), anything())).once();
	});

	it("test special characters and markdown handling", async function (this: Mocha.Context) {
		this.timeout(10_000);

		await createTestThread({ messageId: TEST_THREAD_ID });

		const specialCharContent =
			"# マークダウンタイトル\n**太字テキスト**\n*斜体テキスト*\n```コードブロック```\n> 引用テキスト\n- リスト項目\n1. 番号付きリスト\n[リンク](https://example.com)\n@mention #channel\n絵文字: 😀 🎉 👍\n特殊文字: !@#$%^&*()_+-=[]{}|;':\",./<>?";

		const { chatAILogicMock } = await executeAIReplyTest({
			content: specialCharContent,
			messageHistory: [{ id: "msg1", author: { bot: false, id: TEST_USER_ID }, content: specialCharContent }],
			threadDto: createTestThreadDto(),
			replyCallback: (prompt, context) => {
				expect(context[0].content.getValue()).to.equal(specialCharContent);
				return Promise.resolve("マークダウンと特殊文字を含むメッセージを受け取りました。");
			},
		});

		verify(chatAILogicMock.replyTalk(anything(), anything())).once();
	});

	it("test long message handling", async function (this: Mocha.Context) {
		this.timeout(10_000);

		await createTestThread({ messageId: TEST_THREAD_ID });

		const longContent = "これは長文メッセージのテストです。".repeat(100);

		const { chatAILogicMock } = await executeAIReplyTest({
			content: longContent,
			messageHistory: [{ id: "msg1", author: { bot: false, id: TEST_USER_ID }, content: longContent }],
			threadDto: createTestThreadDto(),
			replyCallback: (prompt, context) => {
				expect(context[0].content.getValue().length).to.be.at.least(1000);
				return Promise.resolve(`長文メッセージを受け取りました。${"これは応答の一部です。".repeat(50)}`);
			},
		});

		verify(chatAILogicMock.replyTalk(anything(), anything())).once();
	});
});
