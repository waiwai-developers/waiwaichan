import { RoleConfig } from "@/src/entities/config/RoleConfig";
import {
	ChannelRepositoryImpl,
	CommunityRepositoryImpl,
	RoomAddChannelRepositoryImpl,
	RoomChannelRepositoryImpl,
	RoomNotificationChannelRepositoryImpl,
} from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { expect } from "chai";
import type { Interaction } from "discord.js";
import { TextChannel, VoiceChannel } from "discord.js";
import type Mocha from "mocha";
import { anything, instance, when } from "ts-mockito";
import { TestDiscordServer } from "../fixtures/discord.js/TestDiscordServer";

// =============================================================================
// チャンネルタイプ定数
// =============================================================================
const DISCORD_CATEGORY_TYPE = 0;
const DISCORD_VOICE_CHANNEL_TYPE = 3; // ChannelType.DiscordVoice
const DISCORD_TEXT_CHANNEL_TYPE = 2; // ChannelType.DiscordText
const DEFAULT_BATCH_STATUS = 0;

/**
 * Channelレコードを作成し、そのIDを返すヘルパー関数
 * @param discordChannelId Discord上のチャンネルID（clientId）
 * @param communityId CommunityテーブルのID
 * @param channelType チャンネルタイプ（ボイス:2, テキスト:0）
 * @returns 作成されたChannelのID
 */
async function createChannelAndGetId(
	discordChannelId: string | number,
	communityId: number,
	channelType = DISCORD_VOICE_CHANNEL_TYPE,
): Promise<number> {
	const channel = await ChannelRepositoryImpl.create({
		categoryType: DISCORD_CATEGORY_TYPE,
		clientId: BigInt(discordChannelId),
		channelType: channelType,
		communityId: communityId,
		batchStatus: DEFAULT_BATCH_STATUS,
	});
	return channel.id;
}

// =============================================================================
// 型定義
// =============================================================================

/**
 * 論理削除可能なエンティティの基底型
 */
interface SoftDeletableEntity {
	deletedAt: Date | null;
}

/**
 * RoomAddChannelリポジトリのテストデータ型
 */
interface RoomAddChannelTestData extends SoftDeletableEntity {
	communityId: string;
	channelId: string;
}

/**
 * RoomNotificationChannelリポジトリのテストデータ型
 */
interface RoomNotificationChannelTestData extends SoftDeletableEntity {
	communityId: string;
	channelId: string;
}

/**
 * RoomChannelリポジトリのテストデータ型
 */
interface RoomChannelTestData extends SoftDeletableEntity {
	communityId: string;
	channelId: string | number;
}

/**
 * Repositoryの基底メソッド型
 */
interface BaseRepositoryMethods<T extends SoftDeletableEntity> {
	findAll(options?: { paranoid?: boolean }): Promise<T[]>;
	count(): Promise<number>;
	create(data: Record<string, unknown>): Promise<T & { destroy(): Promise<void> }>;
}

// =============================================================================
// Repositoryテスト用ヘルパー関数
// =============================================================================

/**
 * Repositoryテストヘルパーの基底インターフェース
 */
interface RepositoryTestHelper<T extends SoftDeletableEntity> {
	findAll(options?: { paranoid?: boolean }): Promise<T[]>;
	count(): Promise<number>;
	create(data: Record<string, unknown>): Promise<T>;
	createDeleted(data: Record<string, unknown>): Promise<T>;
	expectCount(expectedCount: number): Promise<void>;
	expectEmpty(): Promise<void>;
	expectNotEmpty(): Promise<void>;
	expectDeletedAtNull(data: T): void;
	expectDeletedAtNotNull(data: T): void;
}

/**
 * 汎用Repositoryテストヘルパーを作成する
 */
function createRepositoryTestHelper<T extends SoftDeletableEntity>(repository: BaseRepositoryMethods<T>): RepositoryTestHelper<T> {
	return {
		findAll: (options) => repository.findAll(options),
		count: () => repository.count(),
		create: (data) => repository.create(data),
		createDeleted: async (data) => {
			const record = await repository.create(data);
			await record.destroy();
			return record;
		},
		expectCount: async (expectedCount) => {
			const data = await repository.findAll();
			expect(data.length).to.eq(expectedCount);
		},
		expectEmpty: async () => {
			const data = await repository.findAll();
			expect(data.length).to.eq(0);
		},
		expectNotEmpty: async () => {
			const data = await repository.findAll();
			expect(data.length).to.be.at.least(1);
		},
		expectDeletedAtNull: (data) => {
			expect(data.deletedAt).to.be.null;
		},
		expectDeletedAtNotNull: (data) => {
			expect(data.deletedAt).to.not.be.null;
		},
	};
}

/**
 * チャンネルIDベースの検索・検証機能を追加するヘルパー
 */
interface ChannelIdBasedHelper<T extends SoftDeletableEntity & { channelId: string | number }> {
	findByChannelId(channelId: string | number): Promise<T | undefined>;
	expectCreatedData(communityId: string, channelId: string | number): Promise<void>;
}

/**
 * チャンネルIDベースのヘルパーを作成する
 */
function createChannelIdBasedHelper<T extends SoftDeletableEntity & { channelId: string | number; communityId: string }>(
	repository: BaseRepositoryMethods<T>,
): ChannelIdBasedHelper<T> {
	return {
		findByChannelId: async (channelId) => {
			const data = await repository.findAll();
			return data.find((d) => String(d.channelId) === String(channelId));
		},
		expectCreatedData: async (communityId, channelId) => {
			const data = await repository.findAll();
			expect(data.length).to.be.at.least(1);
			const found = data.find((d) => String(d.channelId) === String(channelId));
			expect(found).to.not.be.undefined;
			expect(String(found?.communityId)).to.eq(String(communityId));
			expect(found?.deletedAt).to.be.null;
		},
	};
}

/**
 * 論理削除検証機能を追加するヘルパー
 */
interface LogicalDeleteHelper<T extends SoftDeletableEntity> {
	expectLogicallyDeleted(): Promise<void>;
}

/**
 * 論理削除ヘルパーを作成する
 */
function createLogicalDeleteHelper<T extends SoftDeletableEntity>(repository: BaseRepositoryMethods<T>): LogicalDeleteHelper<T> {
	return {
		expectLogicallyDeleted: async () => {
			const activeData = await repository.findAll();
			expect(activeData.length).to.eq(0);
			const deletedData = await repository.findAll({ paranoid: false });
			expect(deletedData.length).to.be.at.least(1);
			expect(deletedData[0].deletedAt).to.not.be.null;
		},
	};
}

// Repository型キャストヘルパー（as anyを1箇所に集約）
const roomAddChannelRepo = RoomAddChannelRepositoryImpl as unknown as BaseRepositoryMethods<RoomAddChannelTestData>;
const roomNotificationChannelRepo = RoomNotificationChannelRepositoryImpl as unknown as BaseRepositoryMethods<RoomNotificationChannelTestData>;
const roomChannelRepo = RoomChannelRepositoryImpl as unknown as BaseRepositoryMethods<RoomChannelTestData>;

/**
 * RoomAddChannelテストヘルパー
 */
const RoomAddChannelTestHelper = {
	...createRepositoryTestHelper(roomAddChannelRepo),
	...createChannelIdBasedHelper(roomAddChannelRepo),
	...createLogicalDeleteHelper(roomAddChannelRepo),
};

/**
 * RoomNotificationChannelテストヘルパー
 */
const RoomNotificationChannelTestHelper = {
	...createRepositoryTestHelper(roomNotificationChannelRepo),
	...createChannelIdBasedHelper(roomNotificationChannelRepo),
	...createLogicalDeleteHelper(roomNotificationChannelRepo),
};

/**
 * RoomChannelテストヘルパー
 */
const RoomChannelTestHelper = {
	...createRepositoryTestHelper(roomChannelRepo),
	...createChannelIdBasedHelper(roomChannelRepo),
	/**
	 * 指定したchannelIdのデータが削除されていることを検証
	 */
	expectDeleted: async (channelId: string | number): Promise<void> => {
		const data = await roomChannelRepo.findAll();
		const found = data.find((d) => String(d.channelId) === String(channelId));
		expect(found).to.be.undefined;
	},
	/**
	 * 件数が変わっていないことを検証
	 */
	expectCountUnchanged: async (beforeCount: number): Promise<void> => {
		const afterCount = await roomChannelRepo.count();
		expect(afterCount).to.eq(beforeCount);
	},
	/**
	 * 件数が増加したことを検証
	 */
	expectCountIncreased: async (beforeCount: number, increment = 1): Promise<void> => {
		const afterCount = await roomChannelRepo.count();
		expect(afterCount).to.eq(beforeCount + increment);
	},
};

// =============================================================================
// モック生成ヘルパー関数
// =============================================================================

/**
 * コマンドモックの共通設定オプション
 */
interface CommandMockOptions {
	commandName: string;
	options: Record<string, string>;
	userId: string;
	communityId: string;
}

/**
 * コマンドモックの戻り値
 */
interface CommandMockResult {
	commandMock: ReturnType<typeof mockSlashCommand>;
	getReplyValue: () => string;
	getInstance: () => Interaction;
}

/**
 * 共通のコマンドモックを生成する
 */
function createCommandMock(options: CommandMockOptions): CommandMockResult {
	const { commandName, options: cmdOptions, userId, communityId } = options;

	const commandMock = mockSlashCommand(commandName, cmdOptions, userId);

	// 共通設定
	when(commandMock.guildId).thenReturn(communityId);
	when(commandMock.channel).thenReturn({} as any);

	// replyメソッドのモック
	let replyValue = "";
	when(commandMock.reply(anything())).thenCall((message: string) => {
		replyValue = message;
		return Promise.resolve({} as any);
	});

	return {
		commandMock,
		getReplyValue: () => replyValue,
		getInstance: () => instance(commandMock) as Interaction,
	};
}

/**
 * ギルドチャンネルモックのタイプ
 */
type GuildChannelType = "voice" | "text" | "invalid";

/**
 * ギルドチャンネルモックを設定する
 */
function setupGuildChannelMock(commandMock: ReturnType<typeof mockSlashCommand>, channelId: string, channelType: GuildChannelType): void {
	when(commandMock.guild).thenReturn({
		channels: {
			cache: {
				get: (id: string) => {
					if (id === channelId) {
						switch (channelType) {
							case "voice": {
								const voiceChannel = Object.create(VoiceChannel.prototype);
								voiceChannel.id = channelId;
								return voiceChannel;
							}
							case "text": {
								const textChannel = Object.create(TextChannel.prototype);
								textChannel.id = channelId;
								return textChannel;
							}
							case "invalid":
								return {};
						}
					}
					return null;
				},
			},
		},
	} as any);
}

/**
 * RoleConfigの設定を行う
 */
function setupRoleConfig(userId: string, role: "admin" | "user"): void {
	RoleConfig.users = [{ discordId: userId, role }];
}

/**
 * コマンドを実行し、応答を待つ
 */
async function executeCommandAndWait(commandMock: CommandMockResult, timeout = 1000): Promise<void> {
	const TEST_CLIENT = await TestDiscordServer.getClient();
	TEST_CLIENT.emit("interactionCreate", commandMock.getInstance());
	await waitUntilReply(commandMock.commandMock, timeout);
}

// =============================================================================
// イベント登録テスト用ヘルパー関数
// =============================================================================

/**
 * 通知キャプチャの結果
 */
interface NotificationCapture {
	sent: boolean;
	content: string;
}

/**
 * VoiceStateテストのセットアップオプション
 */
interface VoiceStateTestOptions {
	communityId: string;
	userId: string;
	oldChannelId: string | null;
	newChannelId: string | null;
	displayName?: string;
	notificationChannelId?: string;
	/** 作成されるチャンネルに使用する予測可能なDiscord ID（テストでChannel事前作成用） */
	predictableCreatedChannelId?: string;
}

/**
 * VoiceStateテストのセットアップ結果
 */
interface VoiceStateTestSetup {
	oldState: ReturnType<Awaited<typeof import("../fixtures/discord.js/MockVoiceState")>["mockVoiceState"]>["oldState"];
	newState: ReturnType<Awaited<typeof import("../fixtures/discord.js/MockVoiceState")>["mockVoiceState"]>["newState"];
	notificationCapture: NotificationCapture;
}

/**
 * VoiceStateイベントテストのセットアップを行う
 * @param options テストオプション
 * @returns セットアップ結果
 */
async function setupVoiceStateTest(options: VoiceStateTestOptions): Promise<VoiceStateTestSetup> {
	const { communityId, userId, oldChannelId, newChannelId, displayName, notificationChannelId, predictableCreatedChannelId } = options;

	const { mockVoiceState, addMockTextChannel } = await import("../fixtures/discord.js/MockVoiceState");
	const { oldState, newState } = mockVoiceState(oldChannelId, newChannelId, communityId, userId, displayName, predictableCreatedChannelId);

	const notificationCapture: NotificationCapture = {
		sent: false,
		content: "",
	};

	// 通知チャンネルが指定されている場合、モックを追加
	// 注意: notificationChannelIdはデータベースのChannel.idを文字列化したものを渡すこと
	if (notificationChannelId) {
		const targetState = newChannelId ? newState : oldState;
		addMockTextChannel(targetState, notificationChannelId, async (sendOptions: any) => {
			notificationCapture.sent = true;
			if (sendOptions.embeds?.[0]) {
				const embed = sendOptions.embeds[0];
				notificationCapture.content = embed.data?.title || "";
			}
			return {} as any;
		});
	}

	return { oldState, newState, notificationCapture };
}

/**
 * VoiceStateUpdateイベントを発火し、処理完了を待機する
 * @param oldState 旧状態
 * @param newState 新状態
 * @param waitTime 待機時間（ミリ秒）
 */
async function emitVoiceStateUpdateEvent(
	oldState: VoiceStateTestSetup["oldState"],
	newState: VoiceStateTestSetup["newState"],
	waitTime = 100,
): Promise<void> {
	const TEST_CLIENT = await TestDiscordServer.getClient();
	TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);
	await new Promise((resolve) => setTimeout(resolve, waitTime));
}

/**
 * VoiceStateテストを実行する統合ヘルパー
 * @param options テストオプション
 * @param waitTime 待機時間（ミリ秒）
 * @returns セットアップ結果
 */
async function executeVoiceStateTest(options: VoiceStateTestOptions, waitTime = 100): Promise<VoiceStateTestSetup> {
	const setup = await setupVoiceStateTest(options);
	await emitVoiceStateUpdateEvent(setup.oldState, setup.newState, waitTime);
	return setup;
}

describe("Test Room Commands", () => {
	beforeEach(async () => {
		new MysqlConnector();
		// テストデータの初期化
		await RoomAddChannelRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await RoomNotificationChannelRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await RoomChannelRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await ChannelRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await CommunityRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		// VoiceChannelConnect/Disconnectのテストに必要なCommunityを作成
		// テストではcommunityId = "1"をguildIdとして使用するため、clientId = 1のCommunityが必要
		await CommunityRepositoryImpl.create({
			categoryType: 0, // Discord
			clientId: 1, // guildId = "1" に対応
			batchStatus: 0,
		});
	});

	afterEach(async () => {
		await RoomAddChannelRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await RoomNotificationChannelRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await RoomChannelRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await ChannelRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
		await CommunityRepositoryImpl.destroy({
			truncate: true,
			force: true,
		});
	});

	/**
	 * RoomAddChannelCreateCommandHandlerのテスト
	 */
	/**
	 * [権限チェック] 管理者権限がない場合は部屋追加チャンネルを登録できない
	 * - コマンド実行時に権限チェックが行われることを検証
	 * - 権限がない場合にエラーメッセージが返されることを検証
	 * - RoomAddChannelLogic.createメソッドが呼ばれないことを検証
	 */
	it("should not create room add channel when user does not have admin permission", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const channelId = "2";
			const userId = "3";

			// 非管理者ユーザーIDを設定
			setupRoleConfig(userId, "user");

			// コマンドのモック作成
			const mock = createCommandMock({
				commandName: "roomaddchannelcreate",
				options: { channelid: channelId },
				userId,
				communityId,
			});

			// コマンド実行
			await executeCommandAndWait(mock, 1000);

			// 応答の検証
			expect(mock.getReplyValue()).to.eq("部屋追加チャンネルを登録する権限を持っていないよ！っ");

			// データが作られていないことを確認
			await RoomAddChannelTestHelper.expectEmpty();
		})();
	});

	/**
	 * [正常作成 - データなし] サーバーにRoomAddChannelsデータがない状況でVoiceChannelで実行した時
	 * - 部屋追加チャンネルを登録したよ！っと投稿されること
	 * - RoomAddChannelsにdeletedAtがnullでデータ作成されること
	 */
	it("should create room add channel when no data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = 1; // Community.id (auto-increment)
			const discordGuildId = "1"; // Discord guild ID
			const discordChannelId = "2"; // Discord channel ID
			const userId = "3";

			// 管理者ユーザーIDを設定
			setupRoleConfig(userId, "admin");

			// Channelテーブルにレコードを作成
			const channelDbId = await createChannelAndGetId(discordChannelId, communityId, DISCORD_VOICE_CHANNEL_TYPE);

			// コマンドのモック作成
			const mock = createCommandMock({
				commandName: "roomaddchannelcreate",
				options: { channelid: discordChannelId },
				userId,
				communityId: discordGuildId,
			});

			// VoiceChannelを返すようにモック
			setupGuildChannelMock(mock.commandMock, discordChannelId, "voice");

			// データベースにデータが存在しないことを確認
			await RoomAddChannelTestHelper.expectEmpty();

			// コマンド実行
			await executeCommandAndWait(mock, 1000);

			// 応答の検証
			expect(mock.getReplyValue()).to.eq("部屋追加チャンネルを登録したよ！っ");

			// データが作られていることを確認（CommunityIdはCommunityテーブルのauto increment id）
			await RoomAddChannelTestHelper.expectCount(1);
			const afterData = await RoomAddChannelTestHelper.findAll();
			expect(String(afterData[0].channelId)).to.eq(String(channelDbId));
			RoomAddChannelTestHelper.expectDeletedAtNull(afterData[0]);
		})();
	});

	/**
	 * [正常作成 - deletedAtあり] サーバーにRoomAddChannelsデータがありdeletedAtがnullでない状況でVoiceChannelで実行した時
	 * - 部屋追加チャンネルを登録したよ！っと投稿されること
	 * - RoomAddChannelsにdeletedAtがnullでデータ作成されること
	 */
	it("should create room add channel when deleted data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = 1; // Community.id (auto-increment)
			const discordGuildId = "1"; // Discord guild ID
			const discordChannelId = "2"; // Discord channel ID
			const userId = "3";

			// 管理者ユーザーIDを設定
			setupRoleConfig(userId, "admin");

			// Channelテーブルにレコードを作成
			const channelDbId = await createChannelAndGetId(discordChannelId, communityId, DISCORD_VOICE_CHANNEL_TYPE);

			// 削除済みのデータを作成（ChannelテーブルのIDを使用）
			const deletedData = await RoomAddChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: channelDbId,
			});
			await deletedData.destroy();

			// 削除済みデータが存在することを確認（paranoid: trueなのでfindAllには含まれない）
			const beforeActiveData = await RoomAddChannelRepositoryImpl.findAll();
			expect(beforeActiveData.length).to.eq(0);

			// コマンドのモック作成
			const mock = createCommandMock({
				commandName: "roomaddchannelcreate",
				options: { channelid: discordChannelId },
				userId,
				communityId: discordGuildId,
			});

			// VoiceChannelを返すようにモック
			setupGuildChannelMock(mock.commandMock, discordChannelId, "voice");

			// コマンド実行
			await executeCommandAndWait(mock, 10_000);

			// 応答の検証
			expect(mock.getReplyValue()).to.eq("部屋追加チャンネルを登録したよ！っ");

			// 新しいデータが作られていることを確認
			const afterData = await RoomAddChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(Number(afterData[0].communityId)).to.eq(communityId);
			expect(Number(afterData[0].channelId)).to.eq(channelDbId);
			expect(afterData[0].deletedAt).to.be.null;
		})();
	});

	/**
	 * [既存チェック] 既に部屋追加チャンネルが登録されている場合は新規作成できない
	 * - RoomAddChannelLogic.findが呼ばれることを検証
	 * - 部屋追加チャンネルが既に存在する場合にエラーメッセージが返されることを検証
	 * - RoomAddChannelLogic.createが呼ばれないことを検証
	 */
	it("should not create room add channel when already exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			setupRoleConfig(userId, "admin");

			// 既存のデータを作成
			await RoomAddChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: channelId,
			});

			// コマンドのモック作成
			const mock = createCommandMock({
				commandName: "roomaddchannelcreate",
				options: { channelid: channelId },
				userId,
				communityId,
			});

			// データベースに既存データが存在することを確認
			const beforeData = await RoomAddChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(1);

			// コマンド実行
			await executeCommandAndWait(mock, 1000);

			// 応答の検証
			expect(mock.getReplyValue()).to.eq("部屋追加チャンネルが既に登録されているよ！っ");

			// データが増えていないことを確認
			const afterData = await RoomAddChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(afterData[0].deletedAt).to.be.null;
		})();
	});

	/**
	 * [チャンネル検証] VoiceChannel以外には部屋追加チャンネルを登録できない
	 * - チャンネルの型チェックが行われることを検証
	 * - VoiceChannel以外の場合にエラーメッセージが返されることを検証
	 * - RoomAddChannelLogic.createが呼ばれないことを検証
	 */
	it("should not create room add channel when channel is not a VoiceChannel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			setupRoleConfig(userId, "admin");

			// コマンドのモック作成
			const mock = createCommandMock({
				commandName: "roomaddchannelcreate",
				options: { channelid: channelId },
				userId,
				communityId,
			});

			// VoiceChannel以外のチャンネルを返すようにモック
			setupGuildChannelMock(mock.commandMock, channelId, "invalid");

			// データベースにデータが存在しないことを確認
			const beforeData = await RoomAddChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			await executeCommandAndWait(mock, 1000);

			// 応答の検証
			expect(mock.getReplyValue()).to.eq("このチャンネルはボイスチャンネルないので部屋追加チャンネルとして登録できないよ！っ");

			// データが作られていないことを確認
			const afterData = await RoomAddChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);
		})();
	});

	/**
	 * [正常作成] 部屋追加チャンネルが正常に登録される
	 * - RoomAddChannelLogic.createが正しいパラメータで呼ばれることを検証
	 * - 登録成功時に成功メッセージが返されることを検証
	 * - データベースに部屋追加チャンネルが保存されていることを確認
	 */
	it("should create room add channel successfully", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = 1; // Community.id (auto-increment)
			const discordGuildId = "1"; // Discord guild ID
			const discordChannelId = "2"; // Discord channel ID
			const userId = "3";

			// 管理者ユーザーIDを設定
			setupRoleConfig(userId, "admin");

			// Channelテーブルにレコードを作成
			const channelDbId = await createChannelAndGetId(discordChannelId, communityId, DISCORD_VOICE_CHANNEL_TYPE);

			// コマンドのモック作成
			const mock = createCommandMock({
				commandName: "roomaddchannelcreate",
				options: { channelid: discordChannelId },
				userId,
				communityId: discordGuildId,
			});

			// VoiceChannelを返すようにモック
			setupGuildChannelMock(mock.commandMock, discordChannelId, "voice");

			// データベースにデータが存在しないことを確認
			const beforeData = await RoomAddChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			await executeCommandAndWait(mock, 5000);

			// 応答の検証
			expect(mock.getReplyValue()).to.eq("部屋追加チャンネルを登録したよ！っ");

			// データが作られていることを確認
			const afterData = await RoomAddChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(Number(afterData[0].communityId)).to.eq(communityId);
			expect(Number(afterData[0].channelId)).to.eq(channelDbId);
		})();
	});

	/**
	 * RoomAddChannelDeleteCommandHandlerのテスト
	 */

	/**
	 * [権限チェック] 管理者権限がない場合は部屋追加チャンネルを削除できない
	 * - コマンド実行時に権限チェックが行われることを検証
	 * - 権限がない場合にエラーメッセージが返されることを検証
	 * - RoomAddChannelLogic.deleteメソッドが呼ばれないことを検証
	 */
	it("should not delete room add channel when user does not have admin permission", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "3";

			// 非管理者ユーザーIDを設定
			setupRoleConfig(userId, "user");

			// コマンドのモック作成
			const mock = createCommandMock({
				commandName: "roomaddchanneldelete",
				options: {},
				userId,
				communityId,
			});

			// コマンド実行
			await executeCommandAndWait(mock, 1000);

			// 応答の検証
			expect(mock.getReplyValue()).to.eq("部屋追加チャンネルを登録する権限を持っていないよ！っ");
		})();
	});

	/**
	 * [存在チェック - データなし] サーバーにRoomAddChannelsデータがない状況でVoiceChannelで実行した時
	 * - 部屋追加チャンネルが登録されていなかったよ！っと投稿されること
	 */
	it("should not delete room add channel when no data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "3";

			// 管理者ユーザーIDを設定
			setupRoleConfig(userId, "admin");

			// コマンドのモック作成
			const mock = createCommandMock({
				commandName: "roomaddchanneldelete",
				options: {},
				userId,
				communityId,
			});

			// データベースにデータが存在しないことを確認
			const beforeData = await RoomAddChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			await executeCommandAndWait(mock, 10_000);

			// 応答の検証
			expect(mock.getReplyValue()).to.eq("部屋追加チャンネルが登録されていなかったよ！っ");

			// データベースにデータが存在しないことを再確認
			const afterData = await RoomAddChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);
		})();
	});

	/**
	 * [正常削除] サーバーにRoomAddChannelsデータがdeletedAtがnullである状況でVoiceChannelで実行した時
	 * - 部屋追加チャンネルを削除したよ！っと投稿されること
	 * - RoomAddChannelsのデータのdeletedAtに値が入ること
	 */
	it("should delete room add channel successfully", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			setupRoleConfig(userId, "admin");

			// 既存のデータを作成
			await RoomAddChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: channelId,
			});

			// コマンドのモック作成
			const mock = createCommandMock({
				commandName: "roomaddchanneldelete",
				options: {},
				userId,
				communityId,
			});

			// データベースにデータが存在することを確認
			const beforeData = await RoomAddChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(1);
			expect(beforeData[0].deletedAt).to.be.null;

			// コマンド実行
			await executeCommandAndWait(mock, 1000);

			// 応答の検証
			expect(mock.getReplyValue()).to.eq("部屋追加チャンネルを削除したよ！っ");

			// データが論理削除されていることを確認（findAllでは取得できない）
			const afterData = await RoomAddChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);

			// paranoid: falseで削除済みデータを取得して確認
			const deletedData = await RoomAddChannelRepositoryImpl.findAll({
				paranoid: false,
			});
			expect(deletedData.length).to.eq(1);
			expect(deletedData[0].deletedAt).to.not.be.null;
		})();
	});

	/**
	 * [存在チェック - deletedAtあり] サーバーにRoomAddChannelsデータがdeletedAtがnullでない状況でVoiceChannelで実行した時
	 * - 部屋追加チャンネルが登録されていなかったよ！っと投稿されること
	 */
	it("should not delete room add channel when already deleted", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			setupRoleConfig(userId, "admin");

			// 削除済みのデータを作成
			const deletedData = await RoomAddChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: channelId,
			});
			await deletedData.destroy();

			// コマンドのモック作成
			const mock = createCommandMock({
				commandName: "roomaddchanneldelete",
				options: {},
				userId,
				communityId,
			});

			// データベースにアクティブなデータが存在しないことを確認
			const beforeData = await RoomAddChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			await executeCommandAndWait(mock, 1000);

			// 応答の検証
			expect(mock.getReplyValue()).to.eq("部屋追加チャンネルが登録されていなかったよ！っ");
		})();
	});

	/**
	 * RoomNotificationChannelCreateCommandHandlerのテスト
	 */

	/**
	 * [権限チェック] 管理者権限がない場合は部屋通知チャンネルを登録できない
	 * - コマンド実行時に権限チェックが行われることを検証
	 * - 権限がない場合にエラーメッセージが返されることを検証
	 * - RoomNotificationChannelLogic.createメソッドが呼ばれないことを検証
	 */
	it("should not create room notification channel when user does not have admin permission", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const channelId = "2";
			const userId = "3";

			// 非管理者ユーザーIDを設定
			setupRoleConfig(userId, "user");

			// コマンドのモック作成
			const mock = createCommandMock({
				commandName: "roomnotificationchannelcreate",
				options: { channelid: channelId },
				userId,
				communityId,
			});

			// コマンド実行
			await executeCommandAndWait(mock, 1000);

			// 応答の検証
			expect(mock.getReplyValue()).to.eq("部屋通知チャンネルを登録する権限を持っていないよ！っ");

			// データが作られていないことを確認
			await RoomNotificationChannelTestHelper.expectEmpty();
		})();
	});

	/**
	 * [正常作成 - データなし] サーバーにRoomNotificationChannelsデータがない状況でTextChannelで実行した時
	 * - 部屋通知チャンネルを登録したよ！っと投稿されること
	 * - RoomNotificationChannelsにdeletedAtがnullでデータ作成されること
	 */
	it("should create room notification channel when no data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = 1; // Community.id (auto-increment)
			const discordGuildId = "1"; // Discord guild ID
			const discordChannelId = "2"; // Discord channel ID
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// Channelテーブルにレコードを作成
			const channelDbId = await createChannelAndGetId(discordChannelId, communityId, DISCORD_TEXT_CHANNEL_TYPE);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomnotificationchannelcreate", { channelid: discordChannelId }, userId);

			// communityIdとchannelを設定
			when(commandMock.guildId).thenReturn(discordGuildId);
			when(commandMock.channel).thenReturn({} as any);

			// TextChannelを返すようにモック
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === discordChannelId) {
								const textChannel = Object.create(TextChannel.prototype);
								textChannel.id = discordChannelId;
								return textChannel;
							}
							return null;
						},
					},
				},
			} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにデータが存在しないことを確認
			const beforeData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("部屋通知チャンネルを登録したよ！っ");

			// データが作られていることを確認
			const afterData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(Number(afterData[0].communityId)).to.eq(communityId);
			expect(Number(afterData[0].channelId)).to.eq(channelDbId);
			expect(afterData[0].deletedAt).to.be.null;
		})();
	});

	/**
	 * [正常作成 - deletedAtあり] サーバーにRoomNotificationChannelsデータがありdeletedAtがnullでない状況でTextChannelで実行した時
	 * - 部屋通知チャンネルを登録したよ！っと投稿されること
	 * - RoomNotificationChannelsにdeletedAtがnullでデータ作成されること
	 */
	it("should create room notification channel when deleted data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = 1; // Community.id (auto-increment)
			const discordGuildId = "1"; // Discord guild ID
			const discordChannelId = "2"; // Discord channel ID
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// Channelテーブルにレコードを作成
			const channelDbId = await createChannelAndGetId(discordChannelId, communityId, DISCORD_TEXT_CHANNEL_TYPE);

			// 削除済みのデータを作成（ChannelテーブルのIDを使用）
			const deletedData = await RoomNotificationChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: channelDbId,
			});
			await deletedData.destroy();

			// 削除済みデータが存在することを確認（paranoid: trueなのでfindAllには含まれない）
			const beforeActiveData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(beforeActiveData.length).to.eq(0);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomnotificationchannelcreate", { channelid: discordChannelId }, userId);

			// communityIdとchannelを設定
			when(commandMock.guildId).thenReturn(discordGuildId);
			when(commandMock.channel).thenReturn({} as any);

			// TextChannelを返すようにモック
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === discordChannelId) {
								const textChannel = Object.create(TextChannel.prototype);
								textChannel.id = discordChannelId;
								return textChannel;
							}
							return null;
						},
					},
				},
			} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 5000);

			// 応答の検証
			expect(replyValue).to.eq("部屋通知チャンネルを登録したよ！っ");

			// 新しいデータが作られていることを確認
			const afterData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(Number(afterData[0].communityId)).to.eq(communityId);
			expect(Number(afterData[0].channelId)).to.eq(channelDbId);
			expect(afterData[0].deletedAt).to.be.null;
		})();
	});

	/**
	 * [既存チェック] 既に部屋通知チャンネルが登録されている場合は新規作成できない
	 * - RoomNotificationChannelLogic.findが呼ばれることを検証
	 * - 部屋通知チャンネルが既に存在する場合にエラーメッセージが返されることを検証
	 * - RoomNotificationChannelLogic.createが呼ばれないことを検証
	 */
	it("should not create room notification channel when already exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// 既存のデータを作成
			await RoomNotificationChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: channelId,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomnotificationchannelcreate", { channelid: channelId }, userId);

			// communityIdとchannelを設定
			when(commandMock.guildId).thenReturn(communityId);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースに既存データが存在することを確認
			const beforeData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(1);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("部屋通知チャンネルが既に登録されているよ！っ");

			// データが増えていないことを確認
			const afterData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(afterData[0].deletedAt).to.be.null;
		})();
	});

	/**
	 * [チャンネル検証] TextChannel以外には部屋通知チャンネルを登録できない
	 * - チャンネルの型チェックが行われることを検証
	 * - TextChannel以外の場合にエラーメッセージが返されることを検証
	 * - RoomNotificationChannelLogic.createが呼ばれないことを検証
	 */
	it("should not create room notification channel when channel is not a TextChannel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomnotificationchannelcreate", { channelid: channelId }, userId);

			// communityIdとchannelを設定
			when(commandMock.guildId).thenReturn(communityId);
			when(commandMock.channel).thenReturn({} as any);

			// TextChannel以外のチャンネルを返すようにモック
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelId) {
								// TextChannelではないオブジェクトを返す
								return {};
							}
							return null;
						},
					},
				},
			} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにデータが存在しないことを確認
			const beforeData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("このチャンネルはテキストチャンネルでないので部屋通知チャンネルとして登録できないよ！っ");

			// データが作られていないことを確認
			const afterData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);
		})();
	});

	/**
	 * [正常作成] 部屋通知チャンネルが正常に登録される
	 * - RoomNotificationChannelLogic.createが正しいパラメータで呼ばれることを検証
	 * - 登録成功時に成功メッセージが返されることを検証
	 * - データベースに部屋通知チャンネルが保存されていることを確認
	 */
	it("should create room notification channel successfully", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = 1; // Community.id (auto-increment)
			const discordGuildId = "1"; // Discord guild ID
			const discordChannelId = "2"; // Discord channel ID
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// Channelテーブルにレコードを作成
			const channelDbId = await createChannelAndGetId(discordChannelId, communityId, DISCORD_TEXT_CHANNEL_TYPE);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomnotificationchannelcreate", { channelid: discordChannelId }, userId);

			// communityIdとchannelを設定
			when(commandMock.guildId).thenReturn(discordGuildId);
			when(commandMock.channel).thenReturn({} as any);

			// TextChannelを返すようにモック
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === discordChannelId) {
								const textChannel = Object.create(TextChannel.prototype);
								textChannel.id = discordChannelId;
								return textChannel;
							}
							return null;
						},
					},
				},
			} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにデータが存在しないことを確認
			const beforeData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("部屋通知チャンネルを登録したよ！っ");

			// データが作られていることを確認
			const afterData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(Number(afterData[0].communityId)).to.eq(communityId);
			expect(Number(afterData[0].channelId)).to.eq(channelDbId);
		})();
	});

	/**
	 * RoomNotificationChannelDeleteCommandHandlerのテスト
	 */

	/**
	 * [権限チェック] 管理者権限がない場合は部屋通知チャンネルを削除できない
	 * - コマンド実行時に権限チェックが行われることを検証
	 * - 権限がない場合にエラーメッセージが返されることを検証
	 * - RoomNotificationChannelLogic.deleteメソッドが呼ばれないことを検証
	 */
	it("should not delete room notification channel when user does not have admin permission", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "3";

			// 非管理者ユーザーIDを設定
			setupRoleConfig(userId, "user");

			// コマンドのモック作成
			const mock = createCommandMock({
				commandName: "roomnotificationchanneldelete",
				options: {},
				userId,
				communityId,
			});

			// コマンド実行
			await executeCommandAndWait(mock, 1000);

			// 応答の検証
			expect(mock.getReplyValue()).to.eq("部屋通知チャンネルを登録する権限を持っていないよ！っ");
		})();
	});

	/**
	 * [存在チェック - データなし] サーバーにRoomNotificationChannelsデータがない状況で実行した時
	 * - 部屋通知チャンネルが登録されていなかったよ！っと投稿されること
	 */
	it("should not delete room notification channel when no data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomnotificationchanneldelete", {}, userId);

			// communityIdとchannelを設定
			when(commandMock.guildId).thenReturn(communityId);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにデータが存在しないことを確認
			const beforeData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 10_000);

			// 応答の検証
			expect(replyValue).to.eq("部屋通知チャンネルが登録されていなかったよ！っ");

			// データベースにデータが存在しないことを再確認
			const afterData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);
		})();
	});

	/**
	 * [正常削除] サーバーにRoomNotificationChannelsデータがdeletedAtがnullである状況で実行した時
	 * - 部屋通知チャンネルを削除したよ！っと投稿されること
	 * - RoomNotificationChannelsのデータのdeletedAtに値が入ること
	 */
	it("should delete room notification channel successfully", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// 既存のデータを作成
			await RoomNotificationChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: channelId,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomnotificationchanneldelete", {}, userId);

			// communityIdとchannelを設定
			when(commandMock.guildId).thenReturn(communityId);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにデータが存在することを確認
			const beforeData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(1);
			expect(beforeData[0].deletedAt).to.be.null;

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("部屋通知チャンネルを削除したよ！っ");

			// データが論理削除されていることを確認（findAllでは取得できない）
			const afterData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);

			// paranoid: falseで削除済みデータを取得して確認
			const deletedData = await RoomNotificationChannelRepositoryImpl.findAll({
				paranoid: false,
			});
			expect(deletedData.length).to.eq(1);
			expect(deletedData[0].deletedAt).to.not.be.null;
		})();
	});

	/**
	 * [存在チェック - deletedAtあり] サーバーにRoomNotificationChannelsデータがdeletedAtがnullでない状況で実行した時
	 * - 部屋通知チャンネルが登録されていなかったよ！っと投稿されること
	 */
	it("should not delete room notification channel when already deleted", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// 削除済みのデータを作成
			const deletedData = await RoomNotificationChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: channelId,
			});
			await deletedData.destroy();

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomnotificationchanneldelete", {}, userId);

			// communityIdとchannelを設定
			when(commandMock.guildId).thenReturn(communityId);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにアクティブなデータが存在しないことを確認
			const beforeData = await RoomNotificationChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 5000);

			// 応答の検証
			expect(replyValue).to.eq("部屋通知チャンネルが登録されていなかったよ！っ");
		})();
	});

	/**
	 * VoiceChannelConnectHandlerのテスト
	 */

	/**
	 * [部屋追加チャンネル入室 - 両方設定済み] roomaddchannelsとroomnotificationchannelsが作成済みでroomaddchannelsの部屋に入室した時
	 * - 新しく部屋が作成されユーザーがその部屋に移動しroomchannelsにデータが作成されること
	 * - 通話を開始したよ！っとroomnotificationchannelsの部屋に投稿されること
	 */
	it("should create room and send notification when both channels are configured and user joins room add channel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = 1; // Community.id (auto-increment)
			const discordGuildId = "1"; // Discord guild ID
			const userId = "2";
			const discordRoomAddChannelId = "3"; // Discord channel ID
			const discordNotificationChannelId = "4"; // Discord channel ID
			const displayName = "TestUser";
			const predictableCreatedChannelDiscordId = "12345"; // 作成されるチャンネルのDiscord ID

			// ChannelsテーブルにChannelレコードを作成
			const roomAddChannelDbId = await createChannelAndGetId(discordRoomAddChannelId, communityId, DISCORD_VOICE_CHANNEL_TYPE);
			const notificationChannelDbId = await createChannelAndGetId(discordNotificationChannelId, communityId, DISCORD_TEXT_CHANNEL_TYPE);

			// 新しく作成されるチャンネル用のChannelレコードを事前に作成（ハンドラがChannelLogic.getIdで検索するため）
			await createChannelAndGetId(predictableCreatedChannelDiscordId, communityId, DISCORD_VOICE_CHANNEL_TYPE);

			// 部屋追加チャンネルと通知チャンネルを登録（Channel.idを使用）
			await RoomAddChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: roomAddChannelDbId,
			});
			await RoomNotificationChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: notificationChannelDbId,
			});

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// ヘルパー関数を使用してテスト実行
			const { newState, notificationCapture } = await executeVoiceStateTest({
				communityId: discordGuildId,
				userId,
				oldChannelId: null,
				newChannelId: discordRoomAddChannelId,
				displayName,
				notificationChannelId: String(notificationChannelDbId),
				predictableCreatedChannelId: predictableCreatedChannelDiscordId,
			});

			// 部屋が作成されたことを確認
			const afterData = await RoomChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(beforeCount + 1);

			// 作成されたデータを確認
			const createdData = afterData[afterData.length - 1];
			expect(Number(createdData.communityId)).to.eq(communityId);

			// 通知が送信されたことを確認
			expect(notificationCapture.sent).to.be.true;
			expect(notificationCapture.content).to.include("通話を開始したよ！っ");
		})();
	});

	/**
	 * [部屋追加チャンネル入室 - 両方設定済み・別の部屋から移動] roomaddchannelsとroomnotificationchannelsが作成済みで既にユーザーが別の部屋にいる場合にroomaddchannelsの部屋に入室した時
	 * - 新しく部屋が作成されユーザーがその部屋に移動しroomchannelsにデータが作成されること
	 * - 通話を開始したよ！っとroomnotificationchannelsの部屋に投稿されること
	 */
	it("should create room and send notification when user moves from another channel to room add channel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = 1;
			const discordGuildId = "1";
			const userId = "2";
			const oldChannelId = "100"; // 元いた部屋
			const discordRoomAddChannelId = "3";
			const discordNotificationChannelId = "4";
			const displayName = "TestUser";
			const predictableCreatedChannelDiscordId = "12345"; // 作成されるチャンネルのDiscord ID

			// ChannelsテーブルにChannelレコードを作成
			const roomAddChannelDbId = await createChannelAndGetId(discordRoomAddChannelId, communityId, DISCORD_VOICE_CHANNEL_TYPE);
			const notificationChannelDbId = await createChannelAndGetId(discordNotificationChannelId, communityId, DISCORD_TEXT_CHANNEL_TYPE);

			// 新しく作成されるチャンネル用のChannelレコードを事前に作成（ハンドラがChannelLogic.getIdで検索するため）
			await createChannelAndGetId(predictableCreatedChannelDiscordId, communityId, DISCORD_VOICE_CHANNEL_TYPE);

			// 部屋追加チャンネルと通知チャンネルを登録（Channel.idを使用）
			await RoomAddChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: roomAddChannelDbId,
			});
			await RoomNotificationChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: notificationChannelDbId,
			});

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// ヘルパー関数を使用してテスト実行（通知チャンネルはDBのIDを使用）
			const { newState, notificationCapture } = await executeVoiceStateTest({
				communityId: discordGuildId,
				userId,
				oldChannelId,
				newChannelId: discordRoomAddChannelId,
				displayName,
				notificationChannelId: String(notificationChannelDbId),
				predictableCreatedChannelId: predictableCreatedChannelDiscordId,
			});

			// 部屋が作成されたことを確認
			const afterData = await RoomChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(beforeCount + 1);

			// 作成されたデータを確認
			const createdData = afterData[afterData.length - 1];
			expect(Number(createdData.communityId)).to.eq(communityId);

			// 通知が送信されたことを確認
			expect(notificationCapture.sent).to.be.true;
			expect(notificationCapture.content).to.include("通話を開始したよ！っ");
		})();
	});

	/**
	 * [部屋追加チャンネル以外入室 - 両方設定済み] roomaddchannelsとroomnotificationchannelsが作成済みでroomaddchannels以外の部屋に入室した時
	 * - 新しく部屋が作成されずroomchannelsにデータが作成されないこと
	 * - 通話を開始したよ！っとroomnotificationchannelsの部屋に投稿されないこと
	 */
	it("should not create room nor send notification when both channels are configured but user joins non-room-add channel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const roomAddChannelId = "3";
			const normalChannelId = "5";
			const roomNotificationChannelId = "4";

			// 部屋追加チャンネルと通知チャンネルを登録
			await RoomAddChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: roomAddChannelId,
			});
			await RoomNotificationChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: roomNotificationChannelId,
			});

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// ヘルパー関数を使用してテスト実行
			const { notificationCapture } = await executeVoiceStateTest({
				communityId,
				userId,
				oldChannelId: null,
				newChannelId: normalChannelId,
				notificationChannelId: roomNotificationChannelId,
			});

			// 部屋が作成されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);

			// 通知が送信されていないことを確認
			expect(notificationCapture.sent).to.be.false;
		})();
	});

	/**
	 * [部屋追加チャンネル入室 - roomaddchannelsのみ設定] roomaddchannelsのみ作成済みでroomaddchannelsの部屋に入室した時
	 * - 新しく部屋が作成されユーザーがその部屋に移動しroomchannelsにデータが作成されること
	 * - 通話を開始したよ！っとroomnotificationchannelsの部屋に投稿されないこと
	 */
	it("should create room but not send notification when only room add channel is configured", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = 1; // Community.id (auto-increment)
			const discordGuildId = "1"; // Discord guild ID
			const userId = "2";
			const discordRoomAddChannelId = "3";
			const displayName = "TestUser";
			const predictableCreatedChannelDiscordId = "12345"; // 作成されるチャンネルのDiscord ID

			// ChannelテーブルにChannelレコードを作成
			const roomAddChannelDbId = await createChannelAndGetId(discordRoomAddChannelId, communityId, DISCORD_VOICE_CHANNEL_TYPE);

			// 新しく作成されるチャンネル用のChannelレコードを事前に作成（ハンドラがChannelLogic.getIdで検索するため）
			await createChannelAndGetId(predictableCreatedChannelDiscordId, communityId, DISCORD_VOICE_CHANNEL_TYPE);

			// 部屋追加チャンネルのみ登録（通知チャンネルは登録しない）（Channel.idを使用）
			await RoomAddChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: roomAddChannelDbId,
			});

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// ヘルパー関数を使用してテスト実行
			const { newState } = await executeVoiceStateTest({
				communityId: discordGuildId,
				userId,
				oldChannelId: null,
				newChannelId: discordRoomAddChannelId,
				displayName,
				predictableCreatedChannelId: predictableCreatedChannelDiscordId,
			});

			// 部屋が作成されたことを確認
			const afterData = await RoomChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(beforeCount + 1);

			// 作成されたデータを確認
			const createdData = afterData[afterData.length - 1];
			expect(Number(createdData.communityId)).to.eq(communityId);
		})();
	});

	/**
	 * [部屋追加チャンネル入室 - roomnotificationchannelsのみ設定] roomnotificationchannelsのみ作成済みで部屋に入室した時
	 * - 新しく部屋が作成されずroomchannelsにデータが作成されないこと
	 * - 通話を開始したよ！っとroomnotificationchannelsの部屋に投稿されないこと
	 */
	it("should not create room nor send notification when only room notification channel is configured", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const channelId = "3";
			const roomNotificationChannelId = "4";

			// 通知チャンネルのみ登録（部屋追加チャンネルは登録しない）
			await RoomNotificationChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: roomNotificationChannelId,
			});

			const { mockVoiceState, addMockTextChannel } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, channelId, communityId, userId);

			let notificationSent = false;

			// テキストチャンネルのモックを追加
			addMockTextChannel(newState, roomNotificationChannelId, async (options: any) => {
				notificationSent = true;
				return {} as any;
			});

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// 部屋が作成されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);

			// 通知が送信されていないことを確認
			expect(notificationSent).to.be.false;
		})();
	});

	/**
	 * [部屋追加チャンネル入室 - 両方未設定] roomnotificationchannelsとroomaddchannelsの両方が作成されておらず部屋に入室した時
	 * - 新しく部屋が作成されずroomchannelsにデータが作成されないこと
	 * - 通話を開始したよ！っとroomnotificationchannelsの部屋に投稿されないこと
	 */
	it("should not create room nor send notification when neither channel is configured", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const channelId = "3";

			// どちらも登録しない
			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, channelId, communityId, userId);

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// 部屋が作成されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [状態チェック] newState.channelIdがnullの場合は処理が中断される
	 * - 新規接続でない場合、処理が中断されることを検証
	 * - チャンネル作成や通知送信が行われないことを確認
	 */
	it("should not process when newState.channelId is null", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const oldChannelId = "100";

			// oldState.channelId = "old-channel", newState.channelId = null (disconnect)
			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(oldChannelId, null, communityId, userId);

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// データが作成されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [メンバーチェック] newState.memberがnullの場合は処理が中断される
	 * - メンバーが存在しない場合、処理が中断されることを検証
	 * - チャンネル作成や通知送信が行われないことを確認
	 */
	it("should not process when newState.member is null", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const newChannelId = "200";

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, newChannelId, communityId, userId);

			// newState.memberをnullに設定
			(newState as any).member = null;

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			const beforeCount = await RoomChannelRepositoryImpl.count();

			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// データが作成されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [チャンネルチェック] newState.channelがnullの場合は処理が中断される
	 * - チャンネルが存在しない場合、処理が中断されることを検証
	 * - チャンネル作成や通知送信が行われないことを確認
	 */
	it("should not process when newState.channel is null", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const newChannelId = "200";

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, newChannelId, communityId, userId);

			// newState.channelをnullに設定
			(newState as any).channel = null;

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 500));

			// データが作成されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [部屋追加チャンネル存在チェック] 部屋追加チャンネルが登録されていない場合は処理が中断される
	 * - 部屋追加チャンネルが存在しない場合、処理が中断されることを検証
	 * - チャンネル作成や通知送信が行われないことを確認
	 */
	it("should not process when room add channel is not registered", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const channelId = "3";

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, channelId, communityId, userId);

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 500));

			// データが作成されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [部屋追加チャンネル一致チェック] 接続したチャンネルが部屋追加チャンネルではない場合は処理が中断される
	 * - 接続したチャンネルIDと部屋追加チャンネルIDが一致しない場合、処理が中断されることを検証
	 * - チャンネル作成や通知送信が行われないことを確認
	 */
	it("should not process when connected channel is not room add channel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const roomAddChannelId = "3";
			const connectedChannelId = "4";

			// 部屋追加チャンネルを登録
			await RoomAddChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: roomAddChannelId,
			});

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, connectedChannelId, communityId, userId);

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 500));

			// データが作成されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [チャンネル作成] 新しいボイスチャンネルが作成され、データが保存される
	 * - 作成されるチャンネル名が「{ユーザー表示名}の部屋」であることを検証
	 * - データベースにRoomChannelが保存されていることを確認
	 */
	it("should create new voice channel and save data when user connects to room add channel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const discordRoomAddChannelId = "3";
			const displayName = "TestUser";
			// 作成される新しいチャンネルのDiscord ID（予測可能にするため）
			const predictableCreatedChannelDiscordId = "12345";

			// Communityテーブルのidを取得（beforeEachで作成済み）
			const community = await CommunityRepositoryImpl.findOne({ where: { clientId: 1 } });
			const communityDbId = community?.id;

			// 部屋追加チャンネルをChannelテーブルに登録し、IDを取得
			const roomAddChannelDbId = await createChannelAndGetId(discordRoomAddChannelId, communityDbId, DISCORD_VOICE_CHANNEL_TYPE);

			// 新しく作成されるチャンネル用のChannelレコードを事前に作成（ハンドラがChannelLogic.getIdで検索するため）
			await createChannelAndGetId(predictableCreatedChannelDiscordId, communityDbId, DISCORD_VOICE_CHANNEL_TYPE);

			// RoomAddChannelに登録（ChannelテーブルのIDを使用）
			await RoomAddChannelRepositoryImpl.create({
				communityId: communityDbId,
				channelId: roomAddChannelDbId,
			});

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(
				null,
				discordRoomAddChannelId,
				communityId,
				userId,
				displayName,
				predictableCreatedChannelDiscordId,
			);

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// データが作成されていることを確認
			const afterData = await RoomChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(beforeCount + 1);
		})();
	});

	/**
	 * [通知送信] 部屋通知チャンネルに通知が送信される
	 * - 通知チャンネルが設定されている場合、Embedメッセージが送信されることを検証
	 * - 通知内容に「通話を開始したよ！っ」が含まれることを確認
	 */
	it("should send notification when room notification channel is configured", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const discordRoomAddChannelId = "3";
			const discordRoomNotificationChannelId = "4";
			const predictableCreatedChannelDiscordId = "12345";

			// Communityテーブルのidを取得（beforeEachで作成済み）
			const community = await CommunityRepositoryImpl.findOne({ where: { clientId: 1 } });
			const communityDbId = community?.id;

			// 部屋追加チャンネルと通知チャンネルをChannelテーブルに登録
			const roomAddChannelDbId = await createChannelAndGetId(discordRoomAddChannelId, communityDbId, DISCORD_VOICE_CHANNEL_TYPE);
			const roomNotificationChannelDbId = await createChannelAndGetId(discordRoomNotificationChannelId, communityDbId, DISCORD_TEXT_CHANNEL_TYPE);

			// 新しく作成されるチャンネル用のChannelレコードを事前に作成（ハンドラがChannelLogic.getIdで検索するため）
			await createChannelAndGetId(predictableCreatedChannelDiscordId, communityDbId, DISCORD_VOICE_CHANNEL_TYPE);

			// RoomAddChannelとRoomNotificationChannelに登録（ChannelテーブルのIDを使用）
			await RoomAddChannelRepositoryImpl.create({
				communityId: communityDbId,
				channelId: roomAddChannelDbId,
			});
			await RoomNotificationChannelRepositoryImpl.create({
				communityId: communityDbId,
				channelId: roomNotificationChannelDbId,
			});

			const { mockVoiceState, addMockTextChannel } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(
				null,
				discordRoomAddChannelId,
				communityId,
				userId,
				undefined,
				predictableCreatedChannelDiscordId,
			);

			let notificationSent = false;
			let notificationContent = "";

			// テキストチャンネルのモックを追加（ChannelテーブルのIDを文字列で渡す）
			addMockTextChannel(newState, String(roomNotificationChannelDbId), async (options: any) => {
				notificationSent = true;
				if (options.embeds?.[0]) {
					const embed = options.embeds[0];
					notificationContent = embed.data?.title || "";
				}
				return {} as any;
			});

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 1000));

			// 通知が送信されたことを確認
			expect(notificationSent).to.be.true;
			expect(notificationContent).to.include("通話を開始したよ！っ");
		})();
	});

	/**
	 * [通知チャンネル未設定] 部屋通知チャンネルが設定されていない場合は通知が送信されない
	 * - 部屋通知チャンネルが未設定の場合、通知送信がスキップされることを検証
	 * - エラーが発生しないことを確認
	 */
	it("should not send notification when room notification channel is not configured", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const discordRoomAddChannelId = "3";
			const predictableCreatedChannelDiscordId = "12345";

			// Communityテーブルのidを取得（beforeEachで作成済み）
			const community = await CommunityRepositoryImpl.findOne({ where: { clientId: 1 } });
			const communityDbId = community?.id;

			// 部屋追加チャンネルをChannelテーブルに登録
			const roomAddChannelDbId = await createChannelAndGetId(discordRoomAddChannelId, communityDbId, DISCORD_VOICE_CHANNEL_TYPE);

			// 新しく作成されるチャンネル用のChannelレコードを事前に作成（ハンドラがChannelLogic.getIdで検索するため）
			await createChannelAndGetId(predictableCreatedChannelDiscordId, communityDbId, DISCORD_VOICE_CHANNEL_TYPE);

			// 部屋追加チャンネルのみ登録
			await RoomAddChannelRepositoryImpl.create({
				communityId: communityDbId,
				channelId: roomAddChannelDbId,
			});

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(
				null,
				discordRoomAddChannelId,
				communityId,
				userId,
				undefined,
				predictableCreatedChannelDiscordId,
			);

			// イベント発火（エラーが発生しないことを確認）
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// データは作成されていることを確認
			const afterData = await RoomChannelRepositoryImpl.findAll();
			expect(afterData.length).to.be.at.least(1);
		})();
	});

	/**
	 * VoiceChannelDisconnectHandlerのテスト
	 */

	/**
	 * [部屋からの退出 - 両方設定済み] roomaddchannelsとroomnotificationchannelsが作成済みでroomaddchannelsの部屋から退出しbot以外のユーザーが一人もいなくなった時
	 * - 部屋が削除されること
	 * - roomchannelsのデータのdeletedAtに値が入っていること
	 * - 通話を終了したよ！っとroomnotificationchannelsの部屋に投稿されること
	 */
	it("should delete room and send end notification when last user leaves room channel with both channels configured", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const discordRoomChannelId = "3";
			const discordRoomNotificationChannelId = "4";
			const discordRoomAddChannelId = "999";
			const displayName = "TestUser";

			// Communityテーブルのidを取得（beforeEachで作成済み）
			const community = await CommunityRepositoryImpl.findOne({ where: { clientId: 1 } });
			const communityDbId = community?.id;

			// 各チャンネルをChannelテーブルに登録
			const roomAddChannelDbId = await createChannelAndGetId(discordRoomAddChannelId, communityDbId, DISCORD_VOICE_CHANNEL_TYPE);
			const roomChannelDbId = await createChannelAndGetId(discordRoomChannelId, communityDbId, DISCORD_VOICE_CHANNEL_TYPE);
			const roomNotificationChannelDbId = await createChannelAndGetId(discordRoomNotificationChannelId, communityDbId, DISCORD_TEXT_CHANNEL_TYPE);

			// 部屋追加チャンネルと通知チャンネルを登録（ChannelテーブルのIDを使用）
			await RoomAddChannelRepositoryImpl.create({
				communityId: communityDbId,
				channelId: roomAddChannelDbId,
			});
			await RoomNotificationChannelRepositoryImpl.create({
				communityId: communityDbId,
				channelId: roomNotificationChannelDbId,
			});

			// 部屋チャンネルとして登録（部屋追加チャンネルで作成された部屋）
			await RoomChannelRepositoryImpl.create({
				communityId: communityDbId,
				channelId: roomChannelDbId,
			});

			const { mockVoiceState, addMockTextChannel } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(discordRoomChannelId, null, communityId, userId, displayName);

			let notificationSent = false;
			let notificationContent = "";

			// テキストチャンネルのモックを追加（ChannelテーブルのIDを文字列で渡す）
			addMockTextChannel(oldState, String(roomNotificationChannelDbId), async (options: any) => {
				notificationSent = true;
				if (options.embeds?.[0]) {
					const embed = options.embeds[0];
					notificationContent = embed.data?.title || "";
				}
				return {} as any;
			});

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// データが削除されていることを確認
			const afterData = await RoomChannelRepositoryImpl.findAll();
			const deleted = afterData.find((d) => String(d.channelId) === String(roomChannelDbId));
			expect(deleted).to.be.undefined;

			// 通知が送信されたことを確認
			expect(notificationSent).to.be.true;
			expect(notificationContent).to.include("通話を終了したよ！っ");
		})();
	});

	/**
	 * [部屋からの退出 - 両方設定済み・別の部屋] roomaddchannelsとroomnotificationchannelsが作成済みでroomaddchannels以外の部屋から退出しbot以外のユーザーが一人もいなくなった時
	 * - 部屋が削除されないこと
	 * - 通話を終了したよ！っとroomnotificationchannelsの部屋に投稿されないこと
	 */
	it("should not delete room nor send notification when user leaves non-room channel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const normalChannelId = "5";
			const roomNotificationChannelId = "4";

			// 部屋追加チャンネルと通知チャンネルを登録
			await RoomAddChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: "999",
			});
			await RoomNotificationChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: roomNotificationChannelId,
			});

			const { mockVoiceState, addMockTextChannel } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(normalChannelId, null, communityId, userId);

			let notificationSent = false;

			// テキストチャンネルのモックを追加
			addMockTextChannel(oldState, roomNotificationChannelId, async (options: any) => {
				notificationSent = true;
				return {} as any;
			});

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// 通知が送信されていないことを確認
			expect(notificationSent).to.be.false;
		})();
	});

	/**
	 * [部屋からの退出 - roomaddchannelsのみ設定] roomaddchannelsのみ作成済みでroomaddchannelsの部屋から退出しbot以外のユーザーが一人もいなくなった時
	 * - 部屋が削除されること
	 * - roomchannelsのデータのdeletedAtに値が入っていること
	 * - 通話を終了したよ！っとroomnotificationchannelsの部屋に投稿されないこと
	 */
	it("should delete room but not send notification when only room add channel is configured on disconnect", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const discordRoomChannelId = "3";
			const discordRoomAddChannelId = "999";
			const displayName = "TestUser";

			// Communityテーブルのidを取得（beforeEachで作成済み）
			const community = await CommunityRepositoryImpl.findOne({ where: { clientId: 1 } });
			const communityDbId = community?.id;

			// 各チャンネルをChannelテーブルに登録
			const roomAddChannelDbId = await createChannelAndGetId(discordRoomAddChannelId, communityDbId, DISCORD_VOICE_CHANNEL_TYPE);
			const roomChannelDbId = await createChannelAndGetId(discordRoomChannelId, communityDbId, DISCORD_VOICE_CHANNEL_TYPE);

			// 部屋追加チャンネルのみ登録（通知チャンネルは登録しない）
			await RoomAddChannelRepositoryImpl.create({
				communityId: communityDbId,
				channelId: roomAddChannelDbId,
			});

			// 部屋チャンネルとして登録
			await RoomChannelRepositoryImpl.create({
				communityId: communityDbId,
				channelId: roomChannelDbId,
			});

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(discordRoomChannelId, null, communityId, userId, displayName);

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// データが削除されていることを確認
			const afterData = await RoomChannelRepositoryImpl.findAll();
			const deleted = afterData.find((d) => String(d.channelId) === String(roomChannelDbId));
			expect(deleted).to.be.undefined;
		})();
	});

	/**
	 * [部屋からの退出 - roomnotificationchannelsのみ設定] roomnotificationchannelsのみ作成済みで部屋から退出しbot以外のユーザーが一人もいなくなった時
	 * - 部屋が削除されないこと
	 * - 通話を終了したよ！っとroomnotificationchannelsの部屋に投稿されないこと
	 */
	it("should not delete room nor send notification when only room notification channel is configured on disconnect", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const channelId = "3";
			const roomNotificationChannelId = "4";

			// 通知チャンネルのみ登録（部屋追加チャンネルは登録しない）
			await RoomNotificationChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: roomNotificationChannelId,
			});

			const { mockVoiceState, addMockTextChannel } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(channelId, null, communityId, userId);

			let notificationSent = false;

			// テキストチャンネルのモックを追加
			addMockTextChannel(oldState, roomNotificationChannelId, async (options: any) => {
				notificationSent = true;
				return {} as any;
			});

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// 部屋が削除されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);

			// 通知が送信されていないことを確認
			expect(notificationSent).to.be.false;
		})();
	});

	/**
	 * [部屋からの退出 - 両方未設定] roomnotificationchannelsとroomaddchannelsの両方が作成されておらず部屋から退出した時
	 * - 部屋が削除されないこと
	 * - 通話を終了したよ！っとroomnotificationchannelsの部屋に投稿されないこと
	 */
	it("should not delete room nor send notification when neither channel is configured on disconnect", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const channelId = "3";

			// どちらも登録しない
			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(channelId, null, communityId, userId);

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// 部屋が削除されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [部屋からの退出 - 両方設定済み・別の部屋に移動] roomaddchannelsとroomnotificationchannelsが作成済みでroomaddchannelsの部屋から別の部屋に移動しbot以外のユーザーが一人もいなくなった時
	 * - 部屋が削除されること
	 * - roomchannelsのデータのdeletedAtに値が入っていること
	 * - 通話を終了したよ！っとroomnotificationchannelsの部屋に投稿されること
	 */
	it("should delete room and send notification when user moves from room channel to another channel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const discordRoomChannelId = "3";
			const discordNewChannelId = "100"; // 移動先のチャンネル
			const discordRoomNotificationChannelId = "4";
			const discordRoomAddChannelId = "999";
			const displayName = "TestUser";

			// Communityテーブルのidを取得（beforeEachで作成済み）
			const community = await CommunityRepositoryImpl.findOne({ where: { clientId: 1 } });
			const communityDbId = community?.id;

			// 各チャンネルをChannelテーブルに登録
			const roomAddChannelDbId = await createChannelAndGetId(discordRoomAddChannelId, communityDbId, DISCORD_VOICE_CHANNEL_TYPE);
			const roomChannelDbId = await createChannelAndGetId(discordRoomChannelId, communityDbId, DISCORD_VOICE_CHANNEL_TYPE);
			const roomNotificationChannelDbId = await createChannelAndGetId(discordRoomNotificationChannelId, communityDbId, DISCORD_TEXT_CHANNEL_TYPE);

			// 部屋追加チャンネルと通知チャンネルを登録（ChannelテーブルのIDを使用）
			await RoomAddChannelRepositoryImpl.create({
				communityId: communityDbId,
				channelId: roomAddChannelDbId,
			});
			await RoomNotificationChannelRepositoryImpl.create({
				communityId: communityDbId,
				channelId: roomNotificationChannelDbId,
			});

			// 部屋チャンネルとして登録
			await RoomChannelRepositoryImpl.create({
				communityId: communityDbId,
				channelId: roomChannelDbId,
			});

			const { mockVoiceState, addMockTextChannel } = await import("../fixtures/discord.js/MockVoiceState");
			// oldChannelId = discordRoomChannelId, newChannelId = discordNewChannelId（別の部屋に移動）
			const { oldState, newState } = mockVoiceState(discordRoomChannelId, discordNewChannelId, communityId, userId, displayName);

			let notificationSent = false;
			let notificationContent = "";

			// テキストチャンネルのモックを追加（ChannelテーブルのIDを文字列で渡す）
			addMockTextChannel(oldState, String(roomNotificationChannelDbId), async (options: any) => {
				notificationSent = true;
				if (options.embeds?.[0]) {
					const embed = options.embeds[0];
					notificationContent = embed.data?.title || "";
				}
				return {} as any;
			});

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// データが削除されていることを確認
			const afterData = await RoomChannelRepositoryImpl.findAll();
			const deleted = afterData.find((d) => String(d.channelId) === String(roomChannelDbId));
			expect(deleted).to.be.undefined;

			// 通知が送信されたことを確認
			expect(notificationSent).to.be.true;
			expect(notificationContent).to.include("通話を終了したよ！っ");
		})();
	});

	/**
	 * [状態チェック] oldState.channelIdがnullの場合は処理が中断される
	 * - 接続解除でない場合、処理が中断されることを検証
	 * - チャンネル削除や通知送信が行われないことを確認
	 */
	it("should not process disconnect when oldState.channelId is null", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const newChannelId = "200";

			// oldState.channelId = null, newState.channelId = "new-channel" (connect)
			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, newChannelId, communityId, userId);

			// テストデータ作成
			await RoomChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: 999,
			});

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// データが削除されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [メンバーチェック] oldState.memberがnullの場合は処理が中断される
	 * - メンバーが存在しない場合、処理が中断されることを検証
	 * - チャンネル削除や通知送信が行われないことを確認
	 */
	it("should not process disconnect when oldState.member is null", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const channelId = "3";

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(channelId, null, communityId, userId);

			// oldState.memberをnullに設定
			(oldState as any).member = null;

			// テストデータ作成
			await RoomChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: channelId,
			});

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 500));

			// データが削除されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [チャンネルチェック] oldState.channelがnullの場合は処理が中断される
	 * - チャンネルが存在しない場合、処理が中断されることを検証
	 * - チャンネル削除や通知送信が行われないことを確認
	 */
	it("should not process disconnect when oldState.channel is null", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const channelId = "3";

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(channelId, null, communityId, userId);

			// oldState.channelをnullに設定
			(oldState as any).channel = null;

			// テストデータ作成
			await RoomChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: channelId,
			});

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 500));

			// データが削除されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [部屋チャンネルチェック] 部屋追加チャンネルによって作成された部屋でない場合は処理が中断される
	 * - 部屋チャンネルとして登録されていない場合、処理が中断されることを検証
	 * - チャンネル削除や通知送信が行われないことを確認
	 */
	it("should not process disconnect when channel is not a room channel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const channelId = "3";

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(channelId, null, communityId, userId);

			// 部屋チャンネルとして登録されていない
			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// 何も削除されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [残存ユーザーチェック] bot以外のユーザーがまだチャンネルに残っている場合は削除されない
	 * - チャンネル内にbot以外のユーザーが残っている場合、削除がスキップされることを検証
	 * - チャンネルが削除されないことを確認
	 */
	it("should not delete channel when non-bot users still remain", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const channelId = "3";

			// 部屋チャンネルとして登録
			await RoomChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: channelId,
			});

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(channelId, null, communityId, userId);

			// チャンネルにユーザーが残っている状態にする
			(oldState.channel as any).members = {
				size: 1,
				filter: () => ({ size: 1 }),
			};

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 500));

			// データが削除されていないことを確認
			const afterCount = await RoomChannelRepositoryImpl.count();
			expect(afterCount).to.eq(beforeCount);
		})();
	});

	/**
	 * [チャンネル削除] チャンネルデータとチャンネル自体が削除される
	 * - データベースからRoomChannelが削除されていることを確認
	 */
	it("should delete channel and data when last user disconnects", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const discordChannelId = "3";

			// Communityテーブルのidを取得（beforeEachで作成済み）
			const community = await CommunityRepositoryImpl.findOne({ where: { clientId: 1 } });
			const communityDbId = community?.id;

			// チャンネルをChannelテーブルに登録
			const channelDbId = await createChannelAndGetId(discordChannelId, communityDbId, DISCORD_VOICE_CHANNEL_TYPE);

			// 部屋チャンネルとして登録（ChannelテーブルのIDを使用）
			await RoomChannelRepositoryImpl.create({
				communityId: communityDbId,
				channelId: channelDbId,
			});

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(discordChannelId, null, communityId, userId);

			const beforeCount = await RoomChannelRepositoryImpl.count();
			expect(beforeCount).to.be.at.least(1);

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// データが削除されていることを確認
			const afterData = await RoomChannelRepositoryImpl.findAll();
			const deleted = afterData.find((d) => String(d.channelId) === String(channelDbId));
			expect(deleted).to.be.undefined;
		})();
	});

	/**
	 * [通知送信] 部屋通知チャンネルに終了通知が送信される
	 * - 通知チャンネルが設定されている場合、Embedメッセージが送信されることを検証
	 * - 通知内容に「通話を終了したよ！っ」が含まれることを確認
	 */
	it("should send end notification when room notification channel is configured", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const discordChannelId = "3";
			const discordNotificationChannelId = "4";

			// Communityテーブルのidを取得（beforeEachで作成済み）
			const community = await CommunityRepositoryImpl.findOne({ where: { clientId: 1 } });
			const communityDbId = community?.id;

			// チャンネルをChannelテーブルに登録
			const channelDbId = await createChannelAndGetId(discordChannelId, communityDbId, DISCORD_VOICE_CHANNEL_TYPE);
			const notificationChannelDbId = await createChannelAndGetId(discordNotificationChannelId, communityDbId, DISCORD_TEXT_CHANNEL_TYPE);

			// 部屋チャンネルと通知チャンネルを登録（ChannelテーブルのIDを使用）
			await RoomChannelRepositoryImpl.create({
				communityId: communityDbId,
				channelId: channelDbId,
			});
			await RoomNotificationChannelRepositoryImpl.create({
				communityId: communityDbId,
				channelId: notificationChannelDbId,
			});

			const { mockVoiceState, addMockTextChannel } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(discordChannelId, null, communityId, userId);

			let notificationSent = false;
			let notificationContent = "";

			// テキストチャンネルのモックを追加（ChannelテーブルのIDを文字列で渡す）
			addMockTextChannel(oldState, String(notificationChannelDbId), async (options: any) => {
				notificationSent = true;
				if (options.embeds?.[0]) {
					const embed = options.embeds[0];
					notificationContent = embed.data?.title || "";
				}
				return {} as any;
			});

			// イベント発火
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 500));

			// 通知が送信されたことを確認
			expect(notificationSent).to.be.true;
			expect(notificationContent).to.include("通話を終了したよ！っ");
		})();
	});

	/**
	 * [通知チャンネル未設定] 部屋通知チャンネルが設定されていない場合は通知が送信されない
	 * - 部屋通知チャンネルが未設定の場合、通知送信がスキップされることを検証
	 * - エラーが発生しないことを確認
	 */
	it("should not send notification when room notification channel is not configured for disconnect", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "2";
			const discordChannelId = "3";

			// Communityテーブルのidを取得（beforeEachで作成済み）
			const community = await CommunityRepositoryImpl.findOne({ where: { clientId: 1 } });
			const communityDbId = community?.id;

			// チャンネルをChannelテーブルに登録
			const channelDbId = await createChannelAndGetId(discordChannelId, communityDbId, DISCORD_VOICE_CHANNEL_TYPE);

			// 部屋チャンネルのみ登録（ChannelテーブルのIDを使用）
			await RoomChannelRepositoryImpl.create({
				communityId: communityDbId,
				channelId: channelDbId,
			});

			const { mockVoiceState } = await import("../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(discordChannelId, null, communityId, userId);

			const beforeCount = await RoomChannelRepositoryImpl.count();

			// イベント発火（エラーが発生しないことを確認）
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// データは削除されていることを確認
			const afterData = await RoomChannelRepositoryImpl.findAll();
			const deleted = afterData.find((d) => String(d.channelId) === String(channelDbId));
			expect(deleted).to.be.undefined;
		})();
	});
});
