import type Mocha from "mocha";
import {
	DISCORD_CATEGORY_TYPE,
	RoleConfig,
	RoomCategoryChannelRepositoryImpl,
	TestDiscordServer,
	anything,
	createChannelAndGetId,
	expect,
	instance,
	mockSlashCommand,
	roomTestAfterEach,
	roomTestBeforeEach,
	waitUntilReply,
	when,
} from "./RoomTestHelpers";
import { CategoryChannel } from "discord.js";

describe("Test RoomCategoryChannelCreate Commands", () => {
	beforeEach(async () => {
		await roomTestBeforeEach();
	});

	afterEach(async () => {
		await roomTestAfterEach();
	});

	/**
	 * RoomCategoryChannelCreateCommandHandlerのテスト
	 */

	/**
	 * [権限チェック] 管理者権限がない場合は部屋カテゴリーチャンネルを登録できない
	 * - コマンド実行時に権限チェックが行われることを検証
	 * - 権限がない場合にエラーメッセージが返されることを検証
	 * - RoomCategoryChannelLogic.createメソッドが呼ばれないことを検証
	 */
	it("should not create room category channel when user does not have admin permission", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const channelId = "2";
			const userId = "3";

			// 非管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "user" }];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomcategorychannelcreate", { channelid: channelId }, userId);

			// communityIdとchannelを設定
			when(commandMock.guildId).thenReturn(communityId);
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
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("部屋カテゴリーチャンネルを登録する権限を持っていないよ！っ");

			// データが作られていないことを確認
			const afterData = await RoomCategoryChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);
		})();
	});

	/**
	 * [正常作成 - データなし] サーバーにRoomCategoryChannelsデータがない状況でCategoryChannelで実行した時
	 * - 部屋カテゴリーチャンネルを登録したよ！っと投稿されること
	 * - RoomCategoryChannelsにdeletedAtがnullでデータ作成されること
	 */
	it("should create room category channel when no data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = 1; // Community.id (auto-increment)
			const discordGuildId = "1"; // Discord guild ID
			const discordChannelId = "2"; // Discord channel ID
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// Channelテーブルにレコードを作成
			const channelDbId = await createChannelAndGetId(discordChannelId, communityId, DISCORD_CATEGORY_TYPE);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomcategorychannelcreate", { channelid: discordChannelId }, userId);

			// communityIdとchannelを設定
			when(commandMock.guildId).thenReturn(discordGuildId);
			when(commandMock.channel).thenReturn({} as any);

			// CategoryChannelを返すようにモック
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === discordChannelId) {
								const categoryChannel = Object.create(CategoryChannel.prototype);
								categoryChannel.id = discordChannelId;
								return categoryChannel;
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
			const beforeData = await RoomCategoryChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("部屋カテゴリーチャンネルを登録したよ！っ");

			// データが作られていることを確認
			const afterData = await RoomCategoryChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(Number(afterData[0].communityId)).to.eq(communityId);
			expect(Number(afterData[0].channelId)).to.eq(channelDbId);
			expect(afterData[0].deletedAt).to.be.null;
		})();
	});

	/**
	 * [正常作成 - deletedAtあり] サーバーにRoomCategoryChannelsデータがありdeletedAtがnullでない状況でCategoryChannelで実行した時
	 * - 部屋カテゴリーチャンネルを登録したよ！っと投稿されること
	 * - RoomCategoryChannelsにdeletedAtがnullでデータ作成されること
	 */
	it("should create room category channel when deleted data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = 1; // Community.id (auto-increment)
			const discordGuildId = "1"; // Discord guild ID
			const discordChannelId = "2"; // Discord channel ID
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// Channelテーブルにレコードを作成
			const channelDbId = await createChannelAndGetId(discordChannelId, communityId, DISCORD_CATEGORY_TYPE);

			// 削除済みのデータを作成（ChannelテーブルのIDを使用）
			const deletedData = await RoomCategoryChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: channelDbId,
			});
			await deletedData.destroy();

			// 削除済みデータが存在することを確認（paranoid: trueなのでfindAllには含まれない）
			const beforeActiveData = await RoomCategoryChannelRepositoryImpl.findAll();
			expect(beforeActiveData.length).to.eq(0);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomcategorychannelcreate", { channelid: discordChannelId }, userId);

			// communityIdとchannelを設定
			when(commandMock.guildId).thenReturn(discordGuildId);
			when(commandMock.channel).thenReturn({} as any);

			// CategoryChannelを返すようにモック
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === discordChannelId) {
								const categoryChannel = Object.create(CategoryChannel.prototype);
								categoryChannel.id = discordChannelId;
								return categoryChannel;
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
			expect(replyValue).to.eq("部屋カテゴリーチャンネルを登録したよ！っ");

			// 新しいデータが作られていることを確認
			const afterData = await RoomCategoryChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(Number(afterData[0].communityId)).to.eq(communityId);
			expect(Number(afterData[0].channelId)).to.eq(channelDbId);
			expect(afterData[0].deletedAt).to.be.null;
		})();
	});

	/**
	 * [既存チェック] 既に部屋カテゴリーチャンネルが登録されている場合は新規作成できない
	 * - RoomCategoryChannelLogic.findが呼ばれることを検証
	 * - 部屋カテゴリーチャンネルが既に存在する場合にエラーメッセージが返されることを検証
	 * - RoomCategoryChannelLogic.createが呼ばれないことを検証
	 */
	it("should not create room category channel when already exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// 既存のデータを作成
			await RoomCategoryChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: channelId,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomcategorychannelcreate", { channelid: channelId }, userId);

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
			const beforeData = await RoomCategoryChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(1);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("部屋カテゴリーチャンネルが既に登録されているよ！っ");

			// データが増えていないことを確認
			const afterData = await RoomCategoryChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(afterData[0].deletedAt).to.be.null;
		})();
	});

	/**
	 * [チャンネル検証] CategoryChannel以外には部屋カテゴリーチャンネルを登録できない
	 * - チャンネルの型チェックが行われることを検証
	 * - CategoryChannel以外の場合にエラーメッセージが返されることを検証
	 * - RoomCategoryChannelLogic.createが呼ばれないことを検証
	 */
	it("should not create room category channel when channel is not a CategoryChannel", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomcategorychannelcreate", { channelid: channelId }, userId);

			// communityIdとchannelを設定
			when(commandMock.guildId).thenReturn(communityId);
			when(commandMock.channel).thenReturn({} as any);

			// CategoryChannel以外のチャンネルを返すようにモック
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === channelId) {
								// CategoryChannelではないオブジェクトを返す
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
			const beforeData = await RoomCategoryChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("このチャンネルはカテゴリーチャンネルでないので部屋カテゴリーチャンネルとして登録できないよ！っ");

			// データが作られていないことを確認
			const afterData = await RoomCategoryChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);
		})();
	});

	/**
	 * [正常作成] 部屋カテゴリーチャンネルが正常に登録される
	 * - RoomCategoryChannelLogic.createが正しいパラメータで呼ばれることを検証
	 * - 登録成功時に成功メッセージが返されることを検証
	 * - データベースに部屋カテゴリーチャンネルが保存されていることを確認
	 */
	it("should create room category channel successfully", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = 1; // Community.id (auto-increment)
			const discordGuildId = "1"; // Discord guild ID
			const discordChannelId = "2"; // Discord channel ID
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// Channelテーブルにレコードを作成
			const channelDbId = await createChannelAndGetId(discordChannelId, communityId, DISCORD_CATEGORY_TYPE);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomcategorychannelcreate", { channelid: discordChannelId }, userId);

			// communityIdとchannelを設定
			when(commandMock.guildId).thenReturn(discordGuildId);
			when(commandMock.channel).thenReturn({} as any);

			// CategoryChannelを返すようにモック
			when(commandMock.guild).thenReturn({
				channels: {
					cache: {
						get: (id: string) => {
							if (id === discordChannelId) {
								const categoryChannel = Object.create(CategoryChannel.prototype);
								categoryChannel.id = discordChannelId;
								return categoryChannel;
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
			const beforeData = await RoomCategoryChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("部屋カテゴリーチャンネルを登録したよ！っ");

			// データが作られていることを確認
			const afterData = await RoomCategoryChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(Number(afterData[0].communityId)).to.eq(communityId);
			expect(Number(afterData[0].channelId)).to.eq(channelDbId);
		})();
	});
});
