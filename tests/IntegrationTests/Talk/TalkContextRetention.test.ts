import { AppConfig } from "@/src/entities/config/AppConfig";
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
import type { IMessageLogic } from "@/src/logics/Interfaces/logics/IMessageLogic";
import type { ThreadLogic } from "@/src/logics/ThreadLogic";
import { MessageId } from "@/src/entities/vo/MessageId";
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
	createTestMetadata,
	createTestThread,
	findThreadByMessageId,
} from "./TalkTestHelpers";

describe("Talk Context Retention and End-to-End Tests", function (this: Mocha.Suite) {
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
	 * コンテキスト保持の検証
	 */
	it("test context retention in conversation", async function (this: Mocha.Context) {
		this.timeout(30_000);

		const testMetadata = createTestMetadata();
		await createTestThread({ messageId: TEST_THREAD_ID, metadata: testMetadata });

		const aiReplyHandler = new AIReplyHandler();
		const communityLogicMock = mock<ICommunityLogic>();
		// @ts-ignore
		aiReplyHandler.CommunityLogic = instance(communityLogicMock);
		when(communityLogicMock.getId(anything())).thenResolve(new CommunityId(1));

		const messageLogicMock = mock<IMessageLogic>();
		// @ts-ignore
		aiReplyHandler.MessageLogic = instance(messageLogicMock);
		when(messageLogicMock.getIdByCommunityIdAndClientId(anything(), anything())).thenResolve(new MessageId(TEST_THREAD_ID));

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

		const chatAILogicMock = mock<IChatAILogic>();
		// @ts-ignore
		aiReplyHandler.chatAILogic = instance(chatAILogicMock);

		let capturedContext: ChatAIMessageDto[] = [];

		// 1回目の会話
		const firstMessageHistory = [{ id: "msg1", author: { bot: false, id: TEST_USER_ID }, content: "こんにちは" }];

		const firstMessageCollection = {
			reverse: () => firstMessageHistory,
			map: function (callback: any) {
				return this.reverse().map(callback);
			},
		};

		const firstMessageMock = mockMessage(TEST_USER_ID);
		const channelMock = mock<any>();
		when(channelMock.isThread()).thenReturn(true);
		when(channelMock.guildId).thenReturn(TEST_GUILD_ID);
		when(channelMock.id).thenReturn(TEST_THREAD_ID);
		when(channelMock.ownerId).thenReturn(TEST_BOT_ID);
		when(channelMock.sendTyping()).thenResolve();
		when(channelMock.messages).thenReturn({
			fetch: () => Promise.resolve(firstMessageCollection),
		});

		when(firstMessageMock.channel).thenReturn(instance(channelMock));
		when(firstMessageMock.reply(anything())).thenResolve();

		const firstResponse = "こんにちは！何かお手伝いできることはありますか？";
		when(chatAILogicMock.replyTalk(anything(), anything())).thenCall((prompt, context) => {
			capturedContext = [...context];
			expect(context).to.be.an("array").with.lengthOf(1);
			expect(context[0].role.getValue()).to.equal("user");
			expect(context[0].content.getValue()).to.equal("こんにちは");
			return Promise.resolve(firstResponse);
		});

		await aiReplyHandler.handle(instance(firstMessageMock));
		verify(firstMessageMock.reply(firstResponse)).once();

		// 2回目の会話
		const secondMessageHistory = [
			{ id: "msg1", author: { bot: false, id: TEST_USER_ID }, content: "こんにちは" },
			{ id: "msg2", author: { bot: true, id: TEST_BOT_ID }, content: firstResponse },
			{ id: "msg3", author: { bot: false, id: TEST_USER_ID }, content: "名前は何ですか？" },
		];

		const secondMessageCollection = {
			reverse: () => secondMessageHistory,
			map: function (callback: any) {
				return this.reverse().map(callback);
			},
		};

		const secondMessageMock = mockMessage(TEST_USER_ID);
		const updatedChannelMock = mock<any>();
		when(updatedChannelMock.isThread()).thenReturn(true);
		when(updatedChannelMock.guildId).thenReturn(TEST_GUILD_ID);
		when(updatedChannelMock.id).thenReturn(TEST_THREAD_ID);
		when(updatedChannelMock.ownerId).thenReturn(TEST_BOT_ID);
		when(updatedChannelMock.sendTyping()).thenResolve();
		when(updatedChannelMock.messages).thenReturn({
			fetch: () => Promise.resolve(secondMessageCollection),
		});

		when(secondMessageMock.channel).thenReturn(instance(updatedChannelMock));
		when(secondMessageMock.reply(anything())).thenResolve();

		const secondResponse = "私の名前はわいわいちゃんです！";
		when(chatAILogicMock.replyTalk(anything(), anything())).thenCall((prompt, context) => {
			capturedContext = [...context];
			expect(context).to.be.an("array").with.lengthOf(3);
			expect(context[0].role.getValue()).to.equal("user");
			expect(context[0].content.getValue()).to.equal("こんにちは");
			expect(context[1].role.getValue()).to.equal("assistant");
			expect(context[1].content.getValue()).to.equal(firstResponse);
			expect(context[2].role.getValue()).to.equal("user");
			expect(context[2].content.getValue()).to.equal("名前は何ですか？");
			return Promise.resolve(secondResponse);
		});

		await aiReplyHandler.handle(instance(secondMessageMock));
		verify(secondMessageMock.reply(secondResponse)).once();

		// 3回目の会話
		const thirdMessageHistory = [
			{ id: "msg1", author: { bot: false, id: TEST_USER_ID }, content: "こんにちは" },
			{ id: "msg2", author: { bot: true, id: TEST_BOT_ID }, content: firstResponse },
			{ id: "msg3", author: { bot: false, id: TEST_USER_ID }, content: "名前は何ですか？" },
			{ id: "msg4", author: { bot: true, id: TEST_BOT_ID }, content: secondResponse },
			{ id: "msg5", author: { bot: false, id: TEST_USER_ID }, content: "あなたの名前をもう一度教えてください" },
		];

		const thirdMessageCollection = {
			reverse: () => thirdMessageHistory,
			map: function (callback: any) {
				return this.reverse().map(callback);
			},
		};

		const thirdMessageMock = mockMessage(TEST_USER_ID);
		const thirdChannelMock = mock<any>();
		when(thirdChannelMock.isThread()).thenReturn(true);
		when(thirdChannelMock.guildId).thenReturn(TEST_GUILD_ID);
		when(thirdChannelMock.id).thenReturn(TEST_THREAD_ID);
		when(thirdChannelMock.ownerId).thenReturn(TEST_BOT_ID);
		when(thirdChannelMock.sendTyping()).thenResolve();
		when(thirdChannelMock.messages).thenReturn({
			fetch: () => Promise.resolve(thirdMessageCollection),
		});

		when(thirdMessageMock.channel).thenReturn(instance(thirdChannelMock));
		when(thirdMessageMock.reply(anything())).thenResolve();

		const thirdResponse = "私の名前はわいわいちゃんです！以前もお伝えしましたが、何かお手伝いできることはありますか？";
		when(chatAILogicMock.replyTalk(anything(), anything())).thenCall((prompt, context) => {
			capturedContext = [...context];
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

		await aiReplyHandler.handle(instance(thirdMessageMock));
		verify(thirdMessageMock.reply(thirdResponse)).once();

		// 最終的なコンテキストの検証
		expect(capturedContext.length).to.equal(5);
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
	 * エンドツーエンドフローテスト
	 */
	it("test end-to-end flow from user input to AI response with conversation history", async function (this: Mocha.Context) {
		this.timeout(30_000);

		const testMetadata = createTestMetadata();
		await createTestThread({ messageId: TEST_THREAD_ID, metadata: testMetadata });

		const aiReplyHandler = new AIReplyHandler();
		const communityLogicMock = mock<ICommunityLogic>();
		// @ts-ignore
		aiReplyHandler.CommunityLogic = instance(communityLogicMock);
		when(communityLogicMock.getId(anything())).thenResolve(new CommunityId(1));

		const messageLogicMock = mock<IMessageLogic>();
		// @ts-ignore
		aiReplyHandler.MessageLogic = instance(messageLogicMock);
		when(messageLogicMock.getIdByCommunityIdAndClientId(anything(), anything())).thenResolve(new MessageId(TEST_THREAD_ID));

		const threadLogicMock = mock<ThreadLogic>();
		// @ts-ignore
		aiReplyHandler.threadLogic = instance(threadLogicMock);

		when(threadLogicMock.find(anything(), anything())).thenCall(async (communityId, messageId) => {
			expect(communityId.getValue()).to.equal(1);
			expect(messageId.getValue()).to.equal(TEST_THREAD_ID);

			const thread = await findThreadByMessageId(messageId.getValue());
			return thread ? thread.toDto() : undefined;
		});

		const chatAILogicMock = mock<IChatAILogic>();
		// @ts-ignore
		aiReplyHandler.chatAILogic = instance(chatAILogicMock);

		const testMessageHistory = [
			{ id: "msg1", author: { bot: false, id: TEST_USER_ID }, content: "こんにちは" },
			{ id: "msg2", author: { bot: true, id: TEST_BOT_ID }, content: "こんにちは！何かお手伝いできることはありますか？" },
			{ id: "msg3", author: { bot: false, id: TEST_USER_ID }, content: "今日の天気を教えて" },
		];

		const messageCollection = {
			reverse: () => testMessageHistory,
			map: function (callback: any) {
				return this.reverse().map(callback);
			},
		};

		const firstMessageMock = mockMessage(TEST_USER_ID);
		const channelMock = mock<any>();
		when(channelMock.isThread()).thenReturn(true);
		when(channelMock.guildId).thenReturn(TEST_GUILD_ID);
		when(channelMock.id).thenReturn(TEST_THREAD_ID);
		when(channelMock.ownerId).thenReturn(TEST_BOT_ID);
		when(channelMock.sendTyping()).thenResolve();
		when(channelMock.messages).thenReturn({
			fetch: () => Promise.resolve(messageCollection),
		});

		when(firstMessageMock.channel).thenReturn(instance(channelMock));
		when(firstMessageMock.reply(anything())).thenResolve();

		const firstResponse = "今日の天気は晴れです！";
		when(chatAILogicMock.replyTalk(anything(), anything())).thenCall((prompt, context) => {
			const promptValue = prompt.getValue();
			expect(promptValue).to.deep.equal(testMetadata);

			expect(context).to.be.an("array").with.lengthOf(3);
			expect(context[0].role.getValue()).to.equal("user");
			expect(context[0].content.getValue()).to.equal("こんにちは");
			expect(context[1].role.getValue()).to.equal("assistant");
			expect(context[1].content.getValue()).to.equal("こんにちは！何かお手伝いできることはありますか？");
			expect(context[2].role.getValue()).to.equal("user");
			expect(context[2].content.getValue()).to.equal("今日の天気を教えて");

			return Promise.resolve(firstResponse);
		});

		await aiReplyHandler.handle(instance(firstMessageMock));
		verify(firstMessageMock.reply(firstResponse)).once();

		// スレッドが正しく保存されていることを確認
		const savedThread = await ThreadRepositoryImpl.findOne({
			where: {
				communityId: 1,
				messageId: TEST_THREAD_ID,
			},
		});

		expect(savedThread).to.not.be.null;
		if (savedThread) {
			expect(savedThread.communityId.toString()).to.equal("1");
			expect(savedThread.messageId.toString()).to.equal(TEST_THREAD_ID);
			expect(savedThread.categoryType).to.equal(ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue());

			const metadata = savedThread.metadata;
			expect(metadata).to.not.be.null;
			expect(metadata).to.be.an("object");

			const metadataObj = JSON.parse(JSON.stringify(metadata));
			expect(metadataObj).to.have.property("persona_role", "テスト役割");
			expect(metadataObj).to.have.property("speaking_style_rules", "テストスタイル");
			expect(metadataObj).to.have.property("response_directives", "テスト指示");
			expect(metadataObj).to.have.property("emotion_model", "テスト感情");
			expect(metadataObj).to.have.property("notes", "テスト注釈");
			expect(metadataObj).to.have.property("input_scope", "テスト範囲");
		}
	});
});
