import {
	ChannelRepositoryImpl,
	CommunityRepositoryImpl,
	MessageRepositoryImpl,
	StickyRepositoryImpl,
	UserRepositoryImpl,
} from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";
import { mockMessage } from "@/tests/fixtures/discord.js/MockMessage";
import { expect } from "chai";
import { TextChannel } from "discord.js";
import type Mocha from "mocha";
import { instance, mock, when } from "ts-mockito";
import { TestDiscordServer } from "../../fixtures/discord.js/TestDiscordServer";

// テスト用の定数
const TEST_GUILD_ID = "1234567890"; // communityのclientId
const TEST_USER_ID = "1234"; // userのclientId

// ============================================
// 型定義
// ============================================

/** スティッキーの期待データ */
interface ExpectedStickyData {
	userId?: number;
	messageId?: string;
	message?: string;
}

/** モックメッセージの設定オプション */
interface MockMessageOptions {
	deleteResult?: boolean;
	onDelete?: () => void;
	onEdit?: (newContent: string) => void;
}

/** イベントテスト用オプション */
interface EventMessageMockOptions {
	isBot?: boolean;
	isThread?: boolean;
}

/** モックメッセージオブジェクト */
interface MockDiscordMessage {
	id: string;
	content: string;
	delete: () => Promise<boolean>;
	edit: (newContent: string) => Promise<{ id: string; content: string }>;
}

// ============================================
// モックファクトリ関数
// ============================================

/**
 * RoleConfigのモック設定
 * @param userId ユーザーID
 * @param role ロール ('admin' | 'user')
 */

/**
 * メッセージのモックを作成
 * @param messageId メッセージID
 * @param content メッセージ内容
 * @param options オプション設定
 */
function createMessageMock(messageId: string, content: string, options: MockMessageOptions = {}): MockDiscordMessage {
	const messageMock: MockDiscordMessage = {
		id: messageId,
		content,
		delete: () => {
			options.onDelete?.();
			return Promise.resolve(options.deleteResult ?? true);
		},
		edit: (newContent: string) => {
			options.onEdit?.(newContent);
			messageMock.content = newContent;
			return Promise.resolve({ id: messageId, content: newContent });
		},
	};
	return messageMock;
}

// ============================================
// テストデータ作成ヘルパー
// ============================================

/**
 * Community と User を作成するヘルパー関数
 */
async function createCommunityAndUser(): Promise<{
	communityId: number;
	userId: number;
}> {
	// Create community
	const community = await CommunityRepositoryImpl.create({
		categoryType: 0, // Discord
		clientId: BigInt(TEST_GUILD_ID),
		batchStatus: 0,
	});

	// Create user
	const user = await UserRepositoryImpl.create({
		categoryType: 0, // Discord
		clientId: BigInt(TEST_USER_ID),
		userType: 0, // user
		communityId: community.id,
		batchStatus: 0,
	});

	return {
		communityId: community.id,
		userId: user.id,
	};
}

/**
 * テスト用Channelを作成するヘルパー関数
 * @param communityId コミュニティID
 * @param channelClientId チャンネルのクライアントID（Discord上のチャンネルID）
 * @returns 作成されたチャンネルのID
 */
async function createTestChannel(communityId: number, channelClientId: string): Promise<number> {
	const channel = await ChannelRepositoryImpl.create({
		categoryType: 0, // Discord
		clientId: BigInt(channelClientId),
		channelType: 2, // DiscordText
		communityId: communityId,
		batchStatus: 0,
	});
	return channel.id;
}

/**
 * テスト用スティッキーを作成するヘルパー関数
 */
async function createTestSticky(communityId: number, userId: number, channelId: string, messageId: string, message: string): Promise<void> {
	await StickyRepositoryImpl.create({
		communityId,
		channelId,
		userId,
		messageId,
		message,
	});
}

// ============================================
// イベントテスト用ヘルパー関数
// ============================================

/**
 * イベントテスト用のメッセージモックを設定
 * @param userId ユーザーID
 * @param guildId ギルドID
 * @param channelId チャンネルID
 * @param options オプション設定
 */
function setupEventMessageMock(
	userId: string,
	guildId: string,
	channelId: string,
	options: EventMessageMockOptions = {},
): ReturnType<typeof mockMessage> {
	const messageMock = mockMessage(userId, false, options.isBot ?? false);

	// guildIdとchannelIdを設定
	when(messageMock.guildId).thenReturn(guildId);
	when(messageMock.channelId).thenReturn(channelId);

	// チャンネルをモック
	const channelMock = mock<TextChannel>();
	when(channelMock.isThread()).thenReturn(options.isThread ?? false);
	when(messageMock.channel).thenReturn(instance(channelMock));

	return messageMock;
}

/**
 * イベントテスト用のguildモックを設定（チャンネルキャッシュ付き）
 * @param messageMock メッセージモック
 * @param channelId チャンネルID
 * @param channel チャンネルオブジェクト（undefined=存在しない, {}=非TextChannel, TextChannel=TextChannel）
 */
function setupEventGuildMock(messageMock: ReturnType<typeof mockMessage>, channelId: string, channel: any): void {
	const guildMock = {
		channels: {
			cache: {
				get: (id: string) => (id === channelId ? channel : undefined),
			},
		},
	};
	when(messageMock.guild).thenReturn(guildMock as any);
}

/**
 * イベントテスト用のTextChannelモックを作成
 * @param channelId チャンネルID
 * @param oldMessage 古いメッセージモック
 * @param newMessage 新しいメッセージモック（sendの戻り値）
 */
function createEventTextChannelMock(channelId: string, oldMessage: any, newMessage: any): TextChannel {
	const textChannel = Object.create(TextChannel.prototype);
	textChannel.id = channelId;
	textChannel.type = 0;
	textChannel.send = () => Promise.resolve(newMessage);
	textChannel.messages = { fetch: () => Promise.resolve(oldMessage) };
	return textChannel;
}

/**
 * messageCreateイベントを発火して待つ
 * @param messageMock メッセージモック
 * @param waitMs 待機時間（ミリ秒）
 */
async function emitMessageCreateAndWait(messageMock: ReturnType<typeof mockMessage>, waitMs = 100): Promise<void> {
	const TEST_CLIENT = await TestDiscordServer.getClient();
	TEST_CLIENT.emit("messageCreate", instance(messageMock));
	await new Promise((resolve) => setTimeout(resolve, waitMs));
}

// ============================================
// Repository検証ヘルパー関数
// ============================================

/**
 * スティッキーの件数を検証
 * @param expectedCount 期待されるスティッキーの件数
 */
async function expectStickyCount(expectedCount: number): Promise<void> {
	const stickies = await StickyRepositoryImpl.findAll();
	expect(stickies.length).to.eq(expectedCount);
}

/**
 * 特定のスティッキーが存在し、データが正しいことを検証
 * @param communityId コミュニティID
 * @param channelId チャンネルID
 * @param expectedData 期待されるデータ（オプション）
 */
async function expectStickyExists(communityId: number, channelId: string, expectedData?: ExpectedStickyData): Promise<void> {
	const sticky = await StickyRepositoryImpl.findOne({
		where: { communityId, channelId },
	});
	expect(sticky).to.not.be.null;

	if (expectedData) {
		if (expectedData.userId !== undefined) {
			expect(String(sticky?.userId)).to.eq(String(expectedData.userId));
		}
		if (expectedData.messageId !== undefined) {
			expect(String(sticky?.messageId)).to.eq(String(expectedData.messageId));
		}
		if (expectedData.message !== undefined) {
			expect(sticky?.message).to.eq(expectedData.message);
		}
	}
}

/**
 * スティッキーのmessageIdが変更されていないことを検証
 * @param communityId コミュニティID
 * @param channelId チャンネルID
 * @param expectedMessageId 期待されるメッセージID
 */
async function expectStickyMessageIdUnchanged(communityId: number, channelId: string, expectedMessageId: string): Promise<void> {
	await expectStickyExists(communityId, channelId, { messageId: expectedMessageId });
}

/**
 * スティッキーのmessageIdが更新されたことを検証
 * @param communityId コミュニティID
 * @param channelId チャンネルID
 * @param expectedNewMessageId 期待される新しいメッセージID
 */
async function expectStickyMessageIdUpdated(communityId: number, channelId: string, expectedNewMessageId: string): Promise<void> {
	await expectStickyExists(communityId, channelId, { messageId: expectedNewMessageId });
}

describe("Test StickyEventHandler", () => {
	// テスト用のコミュニティとユーザーのID（autoincrement）
	let testCommunityId: number;
	let testUserId: number;

	beforeEach(async () => {
		new MysqlConnector();
		// Clean up existing records
		await StickyRepositoryImpl.destroy({ truncate: true, force: true });
		await MessageRepositoryImpl.destroy({ truncate: true, force: true });
		await ChannelRepositoryImpl.destroy({ truncate: true, force: true });
		await UserRepositoryImpl.destroy({ truncate: true, force: true });
		await CommunityRepositoryImpl.destroy({ truncate: true, force: true });
		// Create community and user for each test
		const { communityId, userId } = await createCommunityAndUser();
		testCommunityId = communityId;
		testUserId = userId;
	});

	afterEach(async () => {
		await StickyRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await MessageRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await ChannelRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await UserRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await CommunityRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
	});

	/**
	 * [ボットメッセージ] ボットのメッセージではスティッキーが再投稿されない
	 * - ボットからのメッセージの場合、処理が中断されることを検証
	 * - StickyLogic.findが呼ばれないことを検証
	 */
	it("should not repost sticky when message is from a bot", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// テスト用のパラメータ設定
			const guildId = "1";
			const channelId = "2";
			const userId = "3";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// スティッキーをデータベースに作成
			await createTestSticky(testCommunityId, testUserId, channelId, messageId, message);

			// データベースにスティッキーが存在することを確認
			const beforeStickies = await StickyRepositoryImpl.findAll();
			expect(beforeStickies.length).to.eq(1);

			// ボットからのメッセージをモック作成（ヘルパー関数使用）
			const messageMock = setupEventMessageMock(userId, guildId, channelId, { isBot: true });

			// イベント発火と待機
			await emitMessageCreateAndWait(messageMock);

			// StickyのmessageIdが更新されないことを検証
			await expectStickyMessageIdUnchanged(testCommunityId, channelId, messageId);
		})();
	});

	/**
	 * [スレッドメッセージ] スレッド内のメッセージではスティッキーが再投稿されない
	 * - スレッド内のメッセージの場合、処理が中断されることを検証
	 */
	it("should not repost sticky when message is in a thread", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// テスト用のパラメータ設定
			const channelId = "2";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// スティッキーをデータベースに作成
			await createTestSticky(testCommunityId, testUserId, channelId, messageId, message);

			// データベースにスティッキーが存在することを確認
			const beforeStickies = await StickyRepositoryImpl.findAll();
			expect(beforeStickies.length).to.eq(1);

			// スレッド内のメッセージをモック作成（ヘルパー関数使用）
			const messageMock = setupEventMessageMock(TEST_USER_ID, TEST_GUILD_ID, channelId, { isThread: true });

			// イベント発火と待機
			await emitMessageCreateAndWait(messageMock);

			// StickyのmessageIdが更新されないことを検証
			await expectStickyMessageIdUnchanged(testCommunityId, channelId, messageId);
		})();
	});

	/**
	 * [チャンネル検証] チャンネルが存在しない場合は処理が中断される
	 * - チャンネルの存在チェックが行われることを検証
	 * - チャンネルが存在しない場合、処理が中断されることを検証
	 */
	it("should interrupt process when channel does not exist", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// テスト用のパラメータ設定
			const channelId = "2";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// スティッキーをデータベースに作成
			await createTestSticky(testCommunityId, testUserId, channelId, messageId, message);

			// データベースにスティッキーが存在することを確認
			const beforeStickies = await StickyRepositoryImpl.findAll();
			expect(beforeStickies.length).to.eq(1);

			// 通常のユーザーからのメッセージをモック作成（ヘルパー関数使用）
			const messageMock = setupEventMessageMock(TEST_USER_ID, TEST_GUILD_ID, channelId);

			// guildをモック - チャンネルが存在しないように設定（ヘルパー関数使用）
			setupEventGuildMock(messageMock, channelId, undefined);

			// イベント発火と待機
			await emitMessageCreateAndWait(messageMock);

			// StickyのmessageIdが更新されないことを検証
			await expectStickyMessageIdUnchanged(testCommunityId, channelId, messageId);
		})();
	});

	/**
	 * [チャンネル型検証] TextChannel以外では処理が中断される
	 * - チャンネルの型チェックが行われることを検証
	 * - TextChannel以外の場合、処理が中断されることを検証
	 */
	it("should interrupt process when channel is not a TextChannel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// テスト用のパラメータ設定
			const channelId = "2";
			const messageId = "4";
			const message = "スティッキーのメッセージ";

			// スティッキーをデータベースに作成
			await createTestSticky(testCommunityId, testUserId, channelId, messageId, message);

			// データベースにスティッキーが存在することを確認
			const beforeStickies = await StickyRepositoryImpl.findAll();
			expect(beforeStickies.length).to.eq(1);

			// 通常のユーザーからのメッセージをモック作成（ヘルパー関数使用）
			const messageMock = setupEventMessageMock(TEST_USER_ID, TEST_GUILD_ID, channelId);

			// guildをモック - TextChannel以外のチャンネルを返すように設定（ヘルパー関数使用）
			setupEventGuildMock(messageMock, channelId, {}); // 空オブジェクト = 非TextChannel

			// イベント発火と待機
			await emitMessageCreateAndWait(messageMock);

			// StickyのmessageIdが更新されないことを検証
			await expectStickyMessageIdUnchanged(testCommunityId, channelId, messageId);
		})();
	});

	/**
	 * [古いメッセージ削除] 古いスティッキーメッセージが削除される
	 * - 古いメッセージのdeleteメソッドが呼ばれることを検証
	 * - 新しいメッセージIDが正しく設定されることを検証
	 */
	it("should delete old sticky message when new message is posted", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// テスト用のパラメータ設定
			const channelClientId = "2";
			const oldMessageClientId = "4";
			const newMessageClientId = "5";
			const botClientId = "9999"; // botのclientId
			const message = "スティッキーのメッセージ";

			// テスト用Channelを作成（DBのchannel.idを取得）
			const dbChannelId = await createTestChannel(testCommunityId, channelClientId);

			// botユーザーを作成（新しいメッセージのauthor用）
			const botUser = await UserRepositoryImpl.create({
				categoryType: 0, // Discord
				clientId: BigInt(botClientId),
				userType: 1, // bot
				communityId: testCommunityId,
				batchStatus: 0,
			});

			// 古いメッセージをMessageテーブルに作成
			const dbOldMessage = await MessageRepositoryImpl.create({
				categoryType: 0, // Discord
				clientId: BigInt(oldMessageClientId),
				communityId: testCommunityId,
				userId: testUserId,
				channelId: dbChannelId,
				batchStatus: 0,
			});

			// スティッキーをデータベースに作成（DBのchannel.idとMessage.idを使用）
			await StickyRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: String(dbChannelId),
				userId: testUserId,
				messageId: String(dbOldMessage.id),
				message: message,
			});

			// データベースにスティッキーが存在することを確認
			const beforeStickies = await StickyRepositoryImpl.findAll();
			expect(beforeStickies.length).to.eq(1);

			// 通常のユーザーからのメッセージをモック作成（ヘルパー関数使用）
			const messageMock = setupEventMessageMock(TEST_USER_ID, TEST_GUILD_ID, channelClientId);

			// 古いメッセージのモック - 削除が成功するケース
			let deleteWasCalled = false;
			const oldMessageMock = createMessageMock(oldMessageClientId, message, {
				onDelete: () => {
					deleteWasCalled = true;
				},
			});

			// 新しいメッセージのモック - guildIdとchannelIdとauthor.idが必要（StickyEventHandlerでチェックされる）
			const newMessageMock = {
				id: newMessageClientId,
				content: message,
				guildId: TEST_GUILD_ID,
				channelId: channelClientId,
				author: {
					id: botClientId,
				},
			};

			// TextChannelのモック（ヘルパー関数使用）
			const textChannelMock = createEventTextChannelMock(channelClientId, oldMessageMock, newMessageMock);

			// guildをモック - TextChannelを返すように設定（ヘルパー関数使用）
			setupEventGuildMock(messageMock, channelClientId, textChannelMock);

			// イベント発火と待機（時間を増やす）
			await emitMessageCreateAndWait(messageMock, 500);

			// message.delete()が呼ばれることを検証
			expect(deleteWasCalled).to.eq(true);

			// Messageテーブルに新しいメッセージが作成されたか確認
			const afterMessages = await MessageRepositoryImpl.findAll();
			expect(afterMessages.length).to.eq(2); // 古いメッセージ + 新しいメッセージ

			// 新しいメッセージのIDを取得
			const newDbMessage = afterMessages.find((m) => String(m.clientId) === newMessageClientId);
			expect(newDbMessage).to.not.be.undefined;

			// StickyのmessageIdが新しいMessageのIDで更新されたことを検証
			const afterSticky = await StickyRepositoryImpl.findOne({
				where: { communityId: testCommunityId, channelId: String(dbChannelId) },
			});
			expect(String(afterSticky?.messageId)).to.eq(String(newDbMessage?.id));
		})();
	});
});
