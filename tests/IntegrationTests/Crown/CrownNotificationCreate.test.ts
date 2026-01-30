import "reflect-metadata";
import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { ChannelRepositoryImpl, CrownNotificationChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { mockSlashCommand, waitUntilReply as waitSlashUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import { TextChannel } from "discord.js";
import type Mocha from "mocha";
import { anything, instance, when } from "ts-mockito";
import { cleanupCrownTest, setupCrownTest } from "./CrownTestHelper";

const DISCORD_TEXT_CHANNEL_TYPE = 0;
const TEST_GUILD_ID = "1234567890";

async function createChannelAndGetId(discordChannelId: string, communityId: number, channelType: number): Promise<number> {
	const channel = await ChannelRepositoryImpl.create({
		categoryType: 0,
		clientId: BigInt(discordChannelId),
		channelType: channelType,
		communityId: communityId,
		batchStatus: 0,
	});
	return channel.id;
}

async function setupTestEnvironment(): Promise<{ communityId: number }> {
	const { CommunityRepositoryImpl, UserRepositoryImpl } = await import("@/src/repositories/sequelize-mysql");

	const community = await CommunityRepositoryImpl.create({
		categoryType: 0,
		clientId: BigInt(TEST_GUILD_ID),
		batchStatus: 0,
	});

	return {
		communityId: community.id,
	};
}

describe("Test CrownNotificationChannelCreate Commands", () => {
	let testCommunityId: number;

	before(() => {
		setupCrownTest();
	});

	beforeEach(async () => {
		await cleanupCrownTest();
		const context = await setupTestEnvironment();
		testCommunityId = context.communityId;
	});

	afterEach(async () => {
		await cleanupCrownTest();
	});

	/**
	 * CrownNotificationChannelCreateCommandHandlerのテスト
	 */

	/**
	 * [権限チェック] 管理者権限がない場合はクラウン通知チャンネルを登録できない
	 * - コマンド実行時に権限チェックが行われることを検証
	 * - 権限がない場合にエラーメッセージが返されることを検証
	 * - CrownNotificationChannelLogic.createメソッドが呼ばれないことを検証
	 */
	it("should not create crown notification channel when user does not have admin permission", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const channelId = "2";
			const userId = "3";

			// 非管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "user" }];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("crownnotificationchannelcreate", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

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
			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("クラウン通知チャンネルを登録する権限を持っていないよ！っ");

			// データが作られていないことを確認
			const afterData = await CrownNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);
		})();
	});

	/**
	 * [正常作成 - データなし] サーバーにCrownNotificationChannelsデータがない状況でTextChannelで実行した時
	 * - クラウン通知チャンネルを登録したよ！っと投稿されること
	 * - CrownNotificationChannelsにdeletedAtがnullでデータ作成されること
	 */
	it("should create crown notification channel when no data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const discordChannelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// Channelテーブルにレコードを作成
			const channelDbId = await createChannelAndGetId(discordChannelId, testCommunityId, DISCORD_TEXT_CHANNEL_TYPE);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("crownnotificationchannelcreate", { channelid: discordChannelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
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
			const beforeData = await CrownNotificationChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("クラウン通知チャンネルを登録したよ！っ");

			// データが作られていることを確認
			const afterData = await CrownNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(Number(afterData[0].communityId)).to.eq(testCommunityId);
			expect(Number(afterData[0].channelId)).to.eq(channelDbId);
			expect(afterData[0].deletedAt).to.be.null;
		})();
	});

	/**
	 * [正常作成 - deletedAtあり] サーバーにCrownNotificationChannelsデータがありdeletedAtがnullでない状況でTextChannelで実行した時
	 * - クラウン通知チャンネルを登録したよ！っと投稿されること
	 * - CrownNotificationChannelsにdeletedAtがnullでデータ作成されること
	 */
	it("should create crown notification channel when deleted data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const discordChannelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// Channelテーブルにレコードを作成
			const channelDbId = await createChannelAndGetId(discordChannelId, testCommunityId, DISCORD_TEXT_CHANNEL_TYPE);

			// 削除済みのデータを作成（ChannelテーブルのIDを使用）
			const deletedData = await CrownNotificationChannelRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: channelDbId,
			});
			await deletedData.destroy();

			// 削除済みデータが存在することを確認（paranoid: trueなのでfindAllには含まれない）
			const beforeActiveData = await CrownNotificationChannelRepositoryImpl.findAll();
			expect(beforeActiveData.length).to.eq(0);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("crownnotificationchannelcreate", { channelid: discordChannelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
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
			await waitSlashUntilReply(commandMock, 5000);

			// 応答の検証
			expect(replyValue).to.eq("クラウン通知チャンネルを登録したよ！っ");

			// 新しいデータが作られていることを確認
			const afterData = await CrownNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(Number(afterData[0].communityId)).to.eq(testCommunityId);
			expect(Number(afterData[0].channelId)).to.eq(channelDbId);
			expect(afterData[0].deletedAt).to.be.null;
		})();
	});

	/**
	 * [既存チェック] 既にクラウン通知チャンネルが登録されている場合は新規作成できない
	 * - CrownNotificationChannelLogic.findが呼ばれることを検証
	 * - クラウン通知チャンネルが既に存在する場合にエラーメッセージが返されることを検証
	 * - CrownNotificationChannelLogic.createが呼ばれないことを検証
	 */
	it("should not create crown notification channel when already exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// 既存のデータを作成
			await CrownNotificationChannelRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: channelId,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("crownnotificationchannelcreate", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.channel).thenReturn({} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースに既存データが存在することを確認
			const beforeData = await CrownNotificationChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(1);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("クラウンチャンネルが既に登録されているよ！っ");

			// データが増えていないことを確認
			const afterData = await CrownNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(afterData[0].deletedAt).to.be.null;
		})();
	});

	/**
	 * [チャンネル検証] TextChannel以外にはクラウン通知チャンネルを登録できない
	 * - チャンネルの型チェックが行われることを検証
	 * - TextChannel以外の場合にエラーメッセージが返されることを検証
	 * - CrownNotificationChannelLogic.createが呼ばれないことを検証
	 */
	it("should not create crown notification channel when channel is not a TextChannel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("crownnotificationchannelcreate", { channelid: channelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
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
			const beforeData = await CrownNotificationChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("このチャンネルはテキストチャンネルでないのでクラウン通知チャンネルとして登録できないよ！っ");

			// データが作られていないことを確認
			const afterData = await CrownNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);
		})();
	});

	/**
	 * [正常作成] クラウン通知チャンネルが正常に登録される
	 * - CrownNotificationChannelLogic.createが正しいパラメータで呼ばれることを検証
	 * - 登録成功時に成功メッセージが返されることを検証
	 * - データベースにクラウン通知チャンネルが保存されていることを確認
	 */
	it("should create crown notification channel successfully", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const discordChannelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// Channelテーブルにレコードを作成
			const channelDbId = await createChannelAndGetId(discordChannelId, testCommunityId, DISCORD_TEXT_CHANNEL_TYPE);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("crownnotificationchannelcreate", { channelid: discordChannelId }, userId);

			// guildIdとchannelを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
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
			const beforeData = await CrownNotificationChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("クラウン通知チャンネルを登録したよ！っ");

			// データが作られていることを確認
			const afterData = await CrownNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(Number(afterData[0].communityId)).to.eq(testCommunityId);
			expect(Number(afterData[0].channelId)).to.eq(channelDbId);
		})();
	});
});
