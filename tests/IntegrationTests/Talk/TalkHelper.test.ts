import { AppConfig } from "@/src/entities/config/AppConfig";
import { Thread_Fetch_Nom } from "@/src/entities/constants/Thread";
import type { ChatAIMessageDto } from "@/src/entities/dto/ChatAIMessageDto";
import { ThreadDto } from "@/src/entities/dto/ThreadDto";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import { MessageId } from "@/src/entities/vo/MessageId";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";
import { ThreadMetadata } from "@/src/entities/vo/ThreadMetadata";
import { AIReplyHandler } from "@/src/handlers/discord.js/events/AIReplyHandler";
import type { IChatAILogic } from "@/src/logics/Interfaces/logics/IChatAILogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IMessageLogic } from "@/src/logics/Interfaces/logics/IMessageLogic";
import type { ThreadLogic } from "@/src/logics/ThreadLogic";
import { ThreadRepositoryImpl } from "@/src/repositories/sequelize-mysql/ThreadRepositoryImpl";
import { mockMessage } from "@/tests/fixtures/discord.js/MockMessage";
import { mockSlashCommand } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import type { TextChannel } from "discord.js";
import { anything, instance, mock, verify, when } from "ts-mockito";

// ============================================================
// 型定義
// ============================================================

/**
 * スレッドメタデータの型定義
 */
export interface ThreadMetadataContent {
	persona_role: string;
	speaking_style_rules: string;
	response_directives: string;
	emotion_model: string;
	notes: string;
	input_scope: string;
}

/**
 * スレッドデータの型定義（Repositoryから取得したデータ）
 */
export interface ThreadRecord {
	communityId: number | { toString(): string };
	messageId: string | { toString(): string };
	categoryType: number;
	metadata: ThreadMetadataContent | JSON | null;
	toDto?: () => ThreadDto;
}

// ============================================================
// 共通テスト定数
// ============================================================

// テスト用のguildId（MockSlashCommandで使用される値と一致させる）
export const TEST_GUILD_ID = "12345";
export const TEST_THREAD_ID = 67890;
export const TEST_USER_ID = "98765";
export const TEST_BOT_ID = AppConfig.discord.clientId;

// ============================================================
// 共通モック生成ヘルパー関数
// ============================================================

/**
 * テスト用のスレッドメタデータを生成する
 * @param overrides - 上書きするプロパティ
 * @returns スレッドメタデータオブジェクト
 */
export function createTestMetadata(overrides: Partial<ThreadMetadataContent> = {}): ThreadMetadataContent {
	return {
		persona_role: "テスト役割",
		speaking_style_rules: "テストスタイル",
		response_directives: "テスト指示",
		emotion_model: "テスト感情",
		notes: "テスト注釈",
		input_scope: "テスト範囲",
		...overrides,
	};
}

/**
 * テスト用のスレッドデータをリポジトリに作成する
 * @param options - オプションパラメータ
 * @returns 作成されたスレッドデータ
 */
export async function createTestThread(
	options: {
		communityId?: number;
		messageId?: number;
		categoryType?: number;
		metadata?: object;
	} = {},
) {
	return await ThreadRepositoryImpl.create({
		communityId: options.communityId ?? 1,
		messageId: options.messageId ?? TEST_THREAD_ID,
		categoryType: options.categoryType ?? ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue(),
		metadata: options.metadata ?? createTestMetadata(),
	});
}

/**
 * テスト用のThreadDtoを生成する
 * @param options - オプションパラメータ
 * @returns ThreadDtoインスタンス
 */
export function createTestThreadDto(
	options: {
		communityId?: number;
		messageId?: number;
		categoryType?: ThreadCategoryType;
		metadata?: object;
	} = {},
): ThreadDto {
	return new ThreadDto(
		new CommunityId(options.communityId ?? 1),
		new ThreadMessageId(options.messageId ?? TEST_THREAD_ID),
		options.categoryType ?? ThreadCategoryType.CATEGORY_TYPE_CHATGPT,
		new ThreadMetadata((options.metadata ?? createTestMetadata()) as unknown as JSON),
	);
}

/**
 * テスト用のメッセージコレクションモックを生成する
 * @param messages - メッセージ配列
 * @returns メッセージコレクションモック
 */
export function createMessageCollectionMock(
	messages: Array<{
		id?: string;
		author: { bot: boolean; id?: string };
		content: string;
	}>,
) {
	return {
		reverse: () => messages,
		map: function (callback: (msg: (typeof messages)[0]) => unknown) {
			return this.reverse().map(callback);
		},
	};
}

/**
 * テスト用のチャンネルモックを生成・設定する
 * @param options - オプションパラメータ
 * @returns 設定済みのチャンネルモック
 */
export function createChannelMock(
	options: {
		isThread?: boolean;
		guildId?: string;
		threadId?: string;
		ownerId?: string;
		messageCollection?: ReturnType<typeof createMessageCollectionMock>;
	} = {},
) {
	const channelMock = mock<any>();
	when(channelMock.isThread()).thenReturn(options.isThread ?? true);
	when(channelMock.guildId).thenReturn(options.guildId ?? TEST_GUILD_ID);
	when(channelMock.id).thenReturn(options.threadId ?? TEST_THREAD_ID);
	when(channelMock.ownerId).thenReturn(options.ownerId ?? TEST_BOT_ID);
	when(channelMock.sendTyping()).thenResolve();
	when(channelMock.messages).thenReturn({
		fetch: (fetchOptions?: { limit: number }) => {
			if (fetchOptions) {
				expect(fetchOptions).to.deep.equal({ limit: Thread_Fetch_Nom });
			}
			return Promise.resolve(options.messageCollection ?? createMessageCollectionMock([]));
		},
	});
	return channelMock;
}

/**
 * TextChannel用のモックを生成する
 * @returns 設定済みのTextChannelモック
 */
export function createTextChannelMock() {
	const channelMock = mock<TextChannel>();
	when(channelMock.threads).thenReturn({
		create: async () => ({}),
	} as any);
	return channelMock;
}

// ============================================================
// イベント登録テスト用ヘルパー関数
// ============================================================

/**
 * Discord interactionイベントを発行する
 * @param commandMock - コマンドモック
 */
export async function emitInteractionEvent(commandMock: any): Promise<void> {
	const TEST_CLIENT = await TestDiscordServer.getClient();
	TEST_CLIENT.emit("interactionCreate", instance(commandMock));
}

/**
 * AIReplyHandlerでメッセージを処理する
 * @param handler - AIReplyHandlerインスタンス
 * @param messageMock - メッセージモック
 */
export async function handleAIReplyEvent(handler: AIReplyHandler, messageMock: any): Promise<void> {
	await handler.handle(instance(messageMock));
}

/**
 * コマンド実行結果の期待値オプション
 */
export interface CommandTestExpectation {
	/** 応答メッセージの検証 */
	expectReply?: {
		/** 応答が呼ばれる回数 (デフォルト: 1) */
		times?: number;
		/** 応答が呼ばれないことを期待 */
		never?: boolean;
		/** 応答メッセージの内容 */
		content?: string;
	};
	/** スレッド作成の検証 */
	expectThread?: {
		/** スレッドが作成されることを期待 */
		created?: boolean;
		/** 期待するスレッド数 */
		count?: number;
		/** スレッドデータの検証 */
		data?: {
			communityId?: string;
			messageId?: string;
			categoryType?: number;
			metadata?: object;
		};
	};
	/** 待機時間（ミリ秒） */
	waitTime?: number;
}

/**
 * TalkCommandのテスト実行ヘルパー関数
 * コマンド発行からレスポンス検証までを一括で行う
 * @param commandOptions - コマンドオプション
 * @param mockSetup - モック設定
 * @param expectations - 期待値
 * @returns テスト結果
 */
export async function executeTalkCommandTest(
	commandOptions: {
		title: string | null;
		type: number;
	},
	mockSetup: {
		guildId?: string;
		setupChannel?: boolean;
		replyResponse?: any;
	} = {},
	expectations: CommandTestExpectation = {},
): Promise<{
	commandMock: any;
	channelMock: any;
}> {
	const guildId = mockSetup.guildId ?? TEST_GUILD_ID;

	// コマンドモックの設定
	const commandMock = mockSlashCommand("talk", commandOptions, { guildId });

	// チャンネルモックの設定
	let channelMock: any = null;
	if (mockSetup.setupChannel !== false) {
		channelMock = createTextChannelMock();
		when(commandMock.channel).thenReturn(instance(channelMock));
	}

	// レスポンスモックの設定
	if (mockSetup.replyResponse !== undefined) {
		when(commandMock.reply(anything())).thenResolve(mockSetup.replyResponse);
	}

	// イベント発行
	await emitInteractionEvent(commandMock);

	// 待機
	if (expectations.waitTime) {
		await new Promise((resolve) => setTimeout(resolve, expectations.waitTime));
	}

	// 応答の検証
	if (expectations.expectReply) {
		if (expectations.expectReply.never) {
			verify(commandMock.reply(anything())).never();
		} else if (expectations.expectReply.content) {
			verify(commandMock.reply(expectations.expectReply.content)).times(expectations.expectReply.times ?? 1);
		} else {
			verify(commandMock.reply(anything())).times(expectations.expectReply.times ?? 1);
		}
	}

	// スレッド作成の検証
	if (expectations.expectThread) {
		if (expectations.expectThread.created === false || expectations.expectThread.count === 0) {
			await assertNoThreadsCreated();
		} else if (expectations.expectThread.count !== undefined) {
			await assertThreadCount(expectations.expectThread.count);
		}
	}

	return { commandMock, channelMock };
}

/**
 * AIReplyHandlerテスト結果の型定義
 */
export interface AIReplyTestResult {
	handler: AIReplyHandler;
	messageMock: ReturnType<typeof mockMessage>;
	channelMock: ReturnType<typeof createChannelMock>;
	communityLogicMock: ICommunityLogic;
	threadLogicMock: ThreadLogic;
	chatAILogicMock: IChatAILogic;
}

/**
 * AIReplyHandlerの動作検証オプション
 */
export interface AIReplyTestExpectation {
	/** AIロジックが呼ばれる回数 */
	expectAICall?: {
		times?: number;
		never?: boolean;
	};
	/** 応答の検証 */
	expectReply?: {
		times?: number;
		never?: boolean;
		content?: string;
	};
	/** sendTypingの検証 */
	expectTyping?: {
		times?: number;
		never?: boolean;
	};
}

/**
 * AIReplyHandlerのテストを実行し、結果を検証する
 * @param options - テストオプション
 * @param expectations - 期待値
 * @returns テスト結果
 */
export async function executeAIReplyTestWithVerification(
	options: {
		userId?: string;
		content?: string;
		messageHistory?: Array<{
			id?: string;
			author: { bot: boolean; id?: string };
			content: string;
		}>;
		threadDto?: ThreadDto;
		replyResponse?: string;
		replyCallback?: (prompt: unknown, context: ChatAIMessageDto[]) => Promise<string>;
		isThread?: boolean;
		ownerId?: string;
	} = {},
	expectations: AIReplyTestExpectation = {},
): Promise<AIReplyTestResult> {
	// テストを実行
	const result = await executeAIReplyTest(options);

	// AIロジック呼び出しの検証
	if (expectations.expectAICall) {
		if (expectations.expectAICall.never) {
			verify(result.chatAILogicMock.replyTalk(anything(), anything())).never();
		} else {
			verify(result.chatAILogicMock.replyTalk(anything(), anything())).times(expectations.expectAICall.times ?? 1);
		}
	}

	// 応答の検証
	if (expectations.expectReply) {
		if (expectations.expectReply.never) {
			verify(result.messageMock.reply(anything())).never();
		} else if (expectations.expectReply.content) {
			verify(result.messageMock.reply(expectations.expectReply.content)).times(expectations.expectReply.times ?? 1);
		} else {
			verify(result.messageMock.reply(anything())).times(expectations.expectReply.times ?? 1);
		}
	}

	// sendTypingの検証
	if (expectations.expectTyping) {
		if (expectations.expectTyping.never) {
			verify(result.channelMock.sendTyping()).never();
		} else {
			verify(result.channelMock.sendTyping()).times(expectations.expectTyping.times ?? 1);
		}
	}

	return result;
}

/**
 * メッセージフィルタリングテスト用のセットアップヘルパー
 * @param options - オプション
 * @returns 設定済みのモックとハンドラー
 */
export async function setupMessageFilteringTest(
	options: {
		isBot?: boolean;
		isThread?: boolean;
		ownerId?: string;
		threadId?: number;
		categoryType?: ThreadCategoryType;
	} = {},
): Promise<{
	handler: AIReplyHandler;
	messageMock: any;
	channelMock: any;
}> {
	const { handler } = createAIReplyHandlerWithMocks({
		threadDto: options.categoryType
			? createTestThreadDto({
					messageId: options.threadId ?? TEST_THREAD_ID,
					categoryType: options.categoryType,
				})
			: undefined,
	});

	const messageMock = mockMessage(TEST_USER_ID, false, options.isBot ?? false);
	const channelMock = createChannelMock({
		isThread: options.isThread ?? true,
		threadId: String(options.threadId ?? TEST_THREAD_ID),
		ownerId: options.ownerId ?? TEST_BOT_ID,
	});

	when(messageMock.channel).thenReturn(instance(channelMock));
	when(messageMock.reply(anything())).thenResolve();

	return { handler, messageMock, channelMock };
}

/**
 * AIReplyHandler初期化オプションの型定義
 */
export interface AIReplyHandlerMockOptions {
	/** ThreadDtoを返すモック設定 */
	threadDto?: ThreadDto;
	/** AI応答文字列 */
	replyResponse?: string;
	/** AI応答コールバック（詳細な検証用） */
	replyCallback?: (prompt: unknown, context: ChatAIMessageDto[]) => Promise<string>;
	/** ThreadLogic.findの振る舞いをカスタマイズ */
	findCallback?: (communityId: CommunityId, messageId: ThreadMessageId) => Promise<ThreadDto | undefined>;
	/** AI応答でエラーをスロー */
	replyThrowError?: Error;
}

/**
 * AIReplyHandlerのインスタンスを作成し、モックを設定する
 * @param options - オプションパラメータ
 * @returns 設定済みのAIReplyHandlerとモック
 */
export function createAIReplyHandlerWithMocks(options: AIReplyHandlerMockOptions = {}) {
	const handler = new AIReplyHandler();

	// CommunityLogicのモックを作成
	const communityLogicMock = mock<ICommunityLogic>();
	// @ts-ignore - privateフィールドにアクセスするため
	handler.CommunityLogic = instance(communityLogicMock);
	when(communityLogicMock.getId(anything())).thenResolve(new CommunityId(1));

	// MessageLogicのモックを作成
	const messageLogicMock = mock<IMessageLogic>();
	// @ts-ignore - privateフィールドにアクセスするため
	handler.MessageLogic = instance(messageLogicMock);
	// デフォルトでMessageId(messageId)を返す（ThreadのmessageIdと一致させる）
	when(messageLogicMock.getIdByCommunityIdAndClientId(anything(), anything())).thenResolve(new MessageId(options.threadDto?.messageId.getValue() ?? TEST_THREAD_ID));

	// ThreadLogicのモックを作成
	const threadLogicMock = mock<ThreadLogic>();
	// @ts-ignore - privateフィールドにアクセスするため
	handler.threadLogic = instance(threadLogicMock);

	if (options.findCallback) {
		when(threadLogicMock.find(anything(), anything())).thenCall(options.findCallback);
	} else if (options.threadDto) {
		when(threadLogicMock.find(anything(), anything())).thenResolve(options.threadDto);
	}

	// ChatAILogicのモックを作成
	const chatAILogicMock = mock<IChatAILogic>();
	// @ts-ignore - privateフィールドにアクセスするため
	handler.chatAILogic = instance(chatAILogicMock);

	if (options.replyThrowError) {
		when(chatAILogicMock.replyTalk(anything(), anything())).thenThrow(options.replyThrowError);
	} else if (options.replyCallback) {
		when(chatAILogicMock.replyTalk(anything(), anything())).thenCall(options.replyCallback);
	} else if (options.replyResponse !== undefined) {
		when(chatAILogicMock.replyTalk(anything(), anything())).thenResolve(options.replyResponse);
	}

	return {
		handler,
		communityLogicMock,
		messageLogicMock,
		threadLogicMock,
		chatAILogicMock,
	};
}

// ============================================================
// Repositoryテスト用ヘルパー関数
// ============================================================

/**
 * 全スレッドを取得する
 * @returns スレッドの配列
 */
export async function findAllThreads() {
	return await ThreadRepositoryImpl.findAll();
}

/**
 * メッセージIDでスレッドを検索する
 * @param messageClientId - メッセージのクライアントID（Discord message ID）
 * @param communityId - コミュニティID（デフォルト: 1）
 * @returns スレッドまたはnull
 */
export async function findThreadByMessageId(messageClientId: string | number, communityId = 1) {
	// First, find the Message record by clientId
	const { MessageRepositoryImpl } = await import("@/src/repositories/sequelize-mysql/MessageRepositoryImpl");
	const message = await MessageRepositoryImpl.findOne({
		where: {
			communityId,
			clientId: BigInt(messageClientId),
		},
	});
	
	if (!message) {
		return null;
	}
	
	// Then find the Thread by the Message's id
	return await ThreadRepositoryImpl.findOne({
		where: {
			communityId,
			messageId: message.id,
		},
	});
}

/**
 * スレッドが作成されていないことを検証する
 */
export async function assertNoThreadsCreated() {
	const threads = await findAllThreads();
	expect(threads.length).to.eq(0);
}

/**
 * スレッド数を検証する
 * @param expectedCount - 期待するスレッド数
 */
export async function assertThreadCount(expectedCount: number) {
	const threads = await findAllThreads();
	expect(threads.length).to.eq(expectedCount);
}

/**
 * スレッドの基本データを検証する
 * @param thread - 検証対象のスレッド
 * @param expected - 期待値
 */
export function verifyThreadData(
	thread: ThreadRecord,
	expected: {
		communityId?: string;
		messageId?: string;
		categoryType?: number;
	},
): void {
	if (expected.communityId !== undefined) {
		expect(thread.communityId.toString()).to.eq(expected.communityId);
	}
	if (expected.messageId !== undefined) {
		expect(thread.messageId.toString()).to.eq(expected.messageId);
	}
	if (expected.categoryType !== undefined) {
		expect(thread.categoryType).to.eq(expected.categoryType);
	}
}

/**
 * スレッドのメタデータを検証する
 * @param thread - 検証対象のスレッド
 * @param expectedMetadata - 期待するメタデータ（部分一致）
 */
export function verifyThreadMetadata(thread: ThreadRecord, expectedMetadata?: Partial<ThreadMetadataContent>): void {
	const metadata = thread.metadata;
	expect(metadata).to.not.be.null;
	expect(metadata).to.be.an("object");

	const metadataObj = JSON.parse(JSON.stringify(metadata)) as ThreadMetadataContent;

	// 基本的なプロパティの存在確認
	expect(metadataObj).to.have.property("persona_role");
	expect(metadataObj).to.have.property("speaking_style_rules");
	expect(metadataObj).to.have.property("response_directives");
	expect(metadataObj).to.have.property("emotion_model");
	expect(metadataObj).to.have.property("notes");
	expect(metadataObj).to.have.property("input_scope");

	// 期待値が指定されている場合は値も検証
	if (expectedMetadata) {
		for (const [key, value] of Object.entries(expectedMetadata)) {
			if (value !== undefined) {
				expect(metadataObj[key as keyof ThreadMetadataContent]).to.eq(value);
			}
		}
	}
}

/**
 * スレッドが存在し、データが正しいことを検証する
 * @param messageId - メッセージID
 * @param expected - 期待値
 * @param communityId - コミュニティID（デフォルト: 1）
 */
export async function assertThreadExistsWithData(
	messageId: string | number,
	expected: {
		communityId?: string;
		categoryType?: number;
		metadata?: Partial<{
			persona_role: string;
			speaking_style_rules: string;
			response_directives: string;
			emotion_model: string;
			notes: string;
			input_scope: string;
		}>;
	},
	communityId = 1,
) {
	const thread = await findThreadByMessageId(messageId, communityId);
	expect(thread).to.not.be.null;

	if (thread) {
		verifyThreadData(thread, {
			communityId: expected.communityId,
			messageId: String(messageId),
			categoryType: expected.categoryType,
		});

		if (expected.metadata !== undefined) {
			verifyThreadMetadata(thread, expected.metadata);
		}
	}
}

/**
 * メッセージモックとチャンネルモックを一括設定する
 * @param options - オプションパラメータ
 * @returns 設定済みのメッセージモックとチャンネルモック
 */
export function setupMessageWithChannel(
	options: {
		userId?: string;
		content?: string;
		isThread?: boolean;
		guildId?: string;
		threadId?: string;
		ownerId?: string;
		messageCollection?: ReturnType<typeof createMessageCollectionMock>;
	} = {},
) {
	const messageMock = mockMessage(options.userId ?? TEST_USER_ID);
	if (options.content !== undefined) {
		when(messageMock.content).thenReturn(options.content);
	}

	const channelMock = createChannelMock({
		isThread: options.isThread,
		guildId: options.guildId,
		threadId: options.threadId,
		ownerId: options.ownerId,
		messageCollection: options.messageCollection,
	});

	when(messageMock.channel).thenReturn(instance(channelMock));
	when(messageMock.reply(anything())).thenResolve();

	return { messageMock, channelMock };
}

/**
 * executeAIReplyTestのオプション型定義
 */
export interface ExecuteAIReplyTestOptions {
	/** ユーザーID */
	userId?: string;
	/** メッセージ内容 */
	content?: string;
	/** メッセージ履歴 */
	messageHistory?: Array<{
		id?: string;
		author: { bot: boolean; id?: string };
		content: string;
	}>;
	/** スレッドDTO */
	threadDto?: ThreadDto;
	/** AI応答文字列 */
	replyResponse?: string;
	/** AI応答コールバック */
	replyCallback?: (prompt: unknown, context: ChatAIMessageDto[]) => Promise<string>;
}

/**
 * AIReplyHandlerのテストを簡略化するためのヘルパー関数
 * Handler作成、メッセージ設定、ハンドル実行を一括で行う
 * @param options - オプションパラメータ
 * @returns テスト結果の検証用オブジェクト
 */
export async function executeAIReplyTest(options: ExecuteAIReplyTestOptions = {}): Promise<AIReplyTestResult> {
	// AIReplyHandlerとモックを作成
	const { handler, communityLogicMock, threadLogicMock, chatAILogicMock } = createAIReplyHandlerWithMocks({
		threadDto: options.threadDto,
		replyResponse: options.replyResponse,
		replyCallback: options.replyCallback,
	});

	// メッセージとチャンネルを設定
	const messageCollection = options.messageHistory ? createMessageCollectionMock(options.messageHistory) : undefined;

	const { messageMock, channelMock } = setupMessageWithChannel({
		userId: options.userId,
		content: options.content,
		messageCollection,
	});

	// ハンドル実行
	await handleAIReplyEvent(handler, messageMock);

	return {
		handler,
		messageMock,
		channelMock,
		communityLogicMock,
		threadLogicMock,
		chatAILogicMock,
	};
}

/**
 * Commandテストを簡略化するためのヘルパー関数
 * コマンドモック作成、イベント発行、応答待機を一括で行う
 * @param commandName - コマンド名
 * @param commandOptions - コマンドオプション
 * @param mockOptions - モックオプション
 * @returns テスト結果の検証用オブジェクト
 */
export async function executeCommandTest(
	commandName: string,
	commandOptions: Record<string, unknown>,
	mockOptions: {
		guildId?: string;
		setupChannel?: boolean;
	} = {},
) {
	const commandMock = mockSlashCommand(commandName, commandOptions, {
		guildId: mockOptions.guildId ?? TEST_GUILD_ID,
	});

	if (mockOptions.setupChannel !== false) {
		const channelMock = createTextChannelMock();
		when(commandMock.channel).thenReturn(instance(channelMock));
	}

	await emitInteractionEvent(commandMock);

	return { commandMock };
}
