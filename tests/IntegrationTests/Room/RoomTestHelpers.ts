import { RoleConfig } from "@/src/entities/config/RoleConfig";
import {
	ChannelRepositoryImpl,
	CommunityRepositoryImpl,
	RoomAddChannelRepositoryImpl,
	RoomCategoryChannelRepositoryImpl,
	RoomChannelRepositoryImpl,
	RoomNotificationChannelRepositoryImpl,
} from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";
import { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { expect } from "chai";
import type { Interaction } from "discord.js";
import { TextChannel, VoiceChannel } from "discord.js";
import { anything, instance, when } from "ts-mockito";
import { TestDiscordServer } from "../../fixtures/discord.js/TestDiscordServer";

// =============================================================================
// チャンネルタイプ定数
// =============================================================================
export const DISCORD_CATEGORY_TYPE = 0;
export const DISCORD_VOICE_CHANNEL_TYPE = 3; // ChannelType.DiscordVoice
export const DISCORD_TEXT_CHANNEL_TYPE = 2; // ChannelType.DiscordText
export const DEFAULT_BATCH_STATUS = 0;

/**
 * Channelレコードを作成し、そのIDを返すヘルパー関数
 * @param discordChannelId Discord上のチャンネルID（clientId）
 * @param communityId CommunityテーブルのID
 * @param channelType チャンネルタイプ（ボイス:2, テキスト:0）
 * @returns 作成されたChannelのID
 */
export async function createChannelAndGetId(
	discordChannelId: string | number,
	communityId: number | undefined,
	channelType = DISCORD_VOICE_CHANNEL_TYPE,
): Promise<number> {
	if (communityId === undefined) {
		throw new Error("communityId must not be undefined");
	}
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
export interface SoftDeletableEntity {
	deletedAt: Date | null;
}

/**
 * RoomAddChannelリポジトリのテストデータ型
 */
export interface RoomAddChannelTestData extends SoftDeletableEntity {
	communityId: string;
	channelId: string;
}

/**
 * RoomNotificationChannelリポジトリのテストデータ型
 */
export interface RoomNotificationChannelTestData extends SoftDeletableEntity {
	communityId: string;
	channelId: string;
}

/**
 * RoomChannelリポジトリのテストデータ型
 */
export interface RoomChannelTestData extends SoftDeletableEntity {
	communityId: string;
	channelId: string | number;
}

/**
 * Repositoryの基底メソッド型
 */
export interface BaseRepositoryMethods<T extends SoftDeletableEntity> {
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
export interface RepositoryTestHelper<T extends SoftDeletableEntity> {
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
export function createRepositoryTestHelper<T extends SoftDeletableEntity>(repository: BaseRepositoryMethods<T>): RepositoryTestHelper<T> {
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
export interface ChannelIdBasedHelper<T extends SoftDeletableEntity & { channelId: string | number }> {
	findByChannelId(channelId: string | number): Promise<T | undefined>;
	expectCreatedData(communityId: string, channelId: string | number): Promise<void>;
}

/**
 * チャンネルIDベースのヘルパーを作成する
 */
export function createChannelIdBasedHelper<T extends SoftDeletableEntity & { channelId: string | number; communityId: string }>(
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
export interface LogicalDeleteHelper<T extends SoftDeletableEntity> {
	expectLogicallyDeleted(): Promise<void>;
}

/**
 * 論理削除ヘルパーを作成する
 */
export function createLogicalDeleteHelper<T extends SoftDeletableEntity>(repository: BaseRepositoryMethods<T>): LogicalDeleteHelper<T> {
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
export const roomAddChannelRepo = RoomAddChannelRepositoryImpl as unknown as BaseRepositoryMethods<RoomAddChannelTestData>;
export const roomNotificationChannelRepo = RoomNotificationChannelRepositoryImpl as unknown as BaseRepositoryMethods<RoomNotificationChannelTestData>;
export const roomChannelRepo = RoomChannelRepositoryImpl as unknown as BaseRepositoryMethods<RoomChannelTestData>;

/**
 * RoomAddChannelテストヘルパー
 */
export const RoomAddChannelTestHelper = {
	...createRepositoryTestHelper(roomAddChannelRepo),
	...createChannelIdBasedHelper(roomAddChannelRepo),
	...createLogicalDeleteHelper(roomAddChannelRepo),
};

/**
 * RoomNotificationChannelテストヘルパー
 */
export const RoomNotificationChannelTestHelper = {
	...createRepositoryTestHelper(roomNotificationChannelRepo),
	...createChannelIdBasedHelper(roomNotificationChannelRepo),
	...createLogicalDeleteHelper(roomNotificationChannelRepo),
};

/**
 * RoomChannelテストヘルパー
 */
export const RoomChannelTestHelper = {
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
export interface CommandMockOptions {
	commandName: string;
	options: Record<string, string>;
	userId: string;
	communityId: string;
}

/**
 * コマンドモックの戻り値
 */
export interface CommandMockResult {
	commandMock: ReturnType<typeof mockSlashCommand>;
	getReplyValue: () => string;
	getInstance: () => Interaction;
}

/**
 * 共通のコマンドモックを生成する
 */
export function createCommandMock(options: CommandMockOptions): CommandMockResult {
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
export type GuildChannelType = "voice" | "text" | "invalid";

/**
 * ギルドチャンネルモックを設定する
 */
export function setupGuildChannelMock(commandMock: ReturnType<typeof mockSlashCommand>, channelId: string, channelType: GuildChannelType): void {
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
export function setupRoleConfig(userId: string, role: "admin" | "user"): void {
	RoleConfig.users = [{ discordId: userId, role }];
}

/**
 * コマンドを実行し、応答を待つ
 */
export async function executeCommandAndWait(commandMock: CommandMockResult, timeout = 1000): Promise<void> {
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
export interface NotificationCapture {
	sent: boolean;
	content: string;
}

/**
 * VoiceStateテストのセットアップオプション
 */
export interface VoiceStateTestOptions {
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
export interface VoiceStateTestSetup {
	oldState: ReturnType<Awaited<typeof import("../../fixtures/discord.js/MockVoiceState")>["mockVoiceState"]>["oldState"];
	newState: ReturnType<Awaited<typeof import("../../fixtures/discord.js/MockVoiceState")>["mockVoiceState"]>["newState"];
	notificationCapture: NotificationCapture;
}

/**
 * VoiceStateイベントテストのセットアップを行う
 * @param options テストオプション
 * @returns セットアップ結果
 */
export async function setupVoiceStateTest(options: VoiceStateTestOptions): Promise<VoiceStateTestSetup> {
	const { communityId, userId, oldChannelId, newChannelId, displayName, notificationChannelId, predictableCreatedChannelId } = options;

	const { mockVoiceState, addMockTextChannel } = await import("../../fixtures/discord.js/MockVoiceState");
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
export async function emitVoiceStateUpdateEvent(
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
export async function executeVoiceStateTest(options: VoiceStateTestOptions, waitTime = 100): Promise<VoiceStateTestSetup> {
	const setup = await setupVoiceStateTest(options);
	await emitVoiceStateUpdateEvent(setup.oldState, setup.newState, waitTime);
	return setup;
}

// =============================================================================
// 共通のbeforeEach/afterEachセットアップ
// =============================================================================

/**
 * Roomテスト用の共通beforeEach処理
 */
export async function roomTestBeforeEach(): Promise<void> {
	new MysqlConnector();
	// テストデータの初期化
	await RoomAddChannelRepositoryImpl.destroy({
		truncate: true,
		force: true,
	});
	await RoomCategoryChannelRepositoryImpl.destroy({
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
}

/**
 * Roomテスト用の共通afterEach処理
 */
export async function roomTestAfterEach(): Promise<void> {
	await RoomAddChannelRepositoryImpl.destroy({
		truncate: true,
		force: true,
	});
	await RoomCategoryChannelRepositoryImpl.destroy({
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
}

// Re-export for convenience
export {
	RoomAddChannelRepositoryImpl,
	RoomCategoryChannelRepositoryImpl,
	RoomNotificationChannelRepositoryImpl,
	RoomChannelRepositoryImpl,
	ChannelRepositoryImpl,
	CommunityRepositoryImpl,
};
export { expect } from "chai";
export { instance, when, anything } from "ts-mockito";
export { mockSlashCommand, waitUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
export { TestDiscordServer } from "../../fixtures/discord.js/TestDiscordServer";
export { TextChannel, VoiceChannel } from "discord.js";
export { RoleConfig } from "@/src/entities/config/RoleConfig";
