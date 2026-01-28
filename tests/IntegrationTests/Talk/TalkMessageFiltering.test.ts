import { AppConfig } from "@/src/entities/config/AppConfig";
import { Thread_Exclude_Prefix } from "@/src/entities/constants/Thread";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { PersonalityId } from "@/src/entities/vo/PersonalityId";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { CommunityRepositoryImpl } from "@/src/repositories/sequelize-mysql/CommunityRepositoryImpl";
import { ContextRepositoryImpl } from "@/src/repositories/sequelize-mysql/ContextRepositoryImpl";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/MysqlConnector";
import { PersonalityContextRepositoryImpl } from "@/src/repositories/sequelize-mysql/PersonalityContextRepositoryImpl";
import { PersonalityRepositoryImpl } from "@/src/repositories/sequelize-mysql/PersonalityRepositoryImpl";
import { ThreadRepositoryImpl } from "@/src/repositories/sequelize-mysql/ThreadRepositoryImpl";
import { mockMessage } from "@/tests/fixtures/discord.js/MockMessage";
import { anything, instance, verify, when } from "ts-mockito";
import {
	TEST_BOT_ID,
	TEST_GUILD_ID,
	TEST_THREAD_ID,
	TEST_USER_ID,
	createAIReplyHandlerWithMocks,
	createTestThread,
	createTestThreadDto,
	executeAIReplyTest,
	handleAIReplyEvent,
	setupMessageWithChannel,
} from "./TalkTestHelpers";

describe("Talk Message Filtering Tests", function (this: Mocha.Suite) {
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
	 * メッセージフィルタリングテスト
	 */
	it("test AIReplyHandler message filtering", async function (this: Mocha.Context) {
		this.timeout(10_000);

		const testOtherThreadId = 67891;
		const testNonChatGPTThreadId = 67892;

		await createTestThread();
		await createTestThread({ messageId: testOtherThreadId });
		await createTestThread({
			messageId: Number(testNonChatGPTThreadId),
			categoryType: ThreadCategoryType.CATEGORY_TYPE_DEEPL.getValue(),
		});

		const { handler, threadLogicMock } = createAIReplyHandlerWithMocks();

		// テストケース1: Bot自身の発言を無視
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

		// テストケース2: スレッド以外のチャンネルを無視
		const { messageMock: nonThreadMessageMock } = setupMessageWithChannel({
			isThread: false,
			threadId: "12345",
		});

		await handleAIReplyEvent(handler, nonThreadMessageMock);
		verify(nonThreadMessageMock.reply(anything())).never();

		// テストケース3: 他ユーザーが所有するスレッドを無視
		const { messageMock: otherOwnerMessageMock } = setupMessageWithChannel({
			threadId: String(testOtherThreadId),
			ownerId: TEST_USER_ID,
		});

		await handleAIReplyEvent(handler, otherOwnerMessageMock);
		verify(otherOwnerMessageMock.reply(anything())).never();

		// テストケース4: ChatGPT以外のカテゴリのスレッドを無視
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
	 * 除外プレフィックス検証 - メッセージの無視
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
	 * 除外プレフィックス検証 - 履歴からの除外
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
				const contents = context.map((entry: any) => entry.content.getValue());
				// 除外プレフィックス付きメッセージが含まれていないことを確認
				for (const content of contents) {
					if (content.startsWith(Thread_Exclude_Prefix)) {
						throw new Error("除外プレフィックス付きメッセージがコンテキストに含まれています");
					}
				}
				return Promise.resolve("テスト応答");
			},
		});

		verify(chatAILogicMock.replyTalk(anything(), anything())).once();
		verify(messageMock.reply(anything())).once();
	});

	/**
	 * Talkスレッドでの除外プレフィックステスト
	 */
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

	/**
	 * Talk履歴から除外プレフィックスメッセージを除外
	 */
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
				// コンテキストの長さ確認（除外プレフィックスメッセージは含まれない）
				if (context.length !== 2) {
					throw new Error(`Expected 2 messages in context, got ${context.length}`);
				}
				const contents = context.map((entry: any) => entry.content.getValue());
				if (contents[0] !== "ユーザーメッセージ1" || contents[1] !== "ボットメッセージ") {
					throw new Error("コンテキストの内容が期待と異なります");
				}
				return Promise.resolve("テスト応答");
			},
		});

		verify(chatAILogicMock.replyTalk(anything(), anything())).once();
	});
});
