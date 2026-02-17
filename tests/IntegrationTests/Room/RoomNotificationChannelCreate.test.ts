import type Mocha from "mocha";
import {
	DISCORD_TEXT_CHANNEL_TYPE,
	RoomNotificationChannelRepositoryImpl,
	TestDiscordServer,
	TextChannel,
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

describe("Test RoomNotificationChannelCreate Commands", () => {
	beforeEach(async () => {
		await roomTestBeforeEach();
	});

	afterEach(async () => {
		await roomTestAfterEach();
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

			// Channelテーブルにレコードを作成
			const channelDbId = await createChannelAndGetId(discordChannelId, communityId, DISCORD_TEXT_CHANNEL_TYPE);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomnotificationchannelcreate", { channelid: discordChannelId }, userId);

			// communityIdとchannelを設定
			when(commandMock.guildId).thenReturn(discordGuildId);
			when(commandMock.channel).thenReturn({} as any);

			// TextChannelを返すようにモック
			when(commandMock.guild).thenReturn({
				ownerId: userId,
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
				ownerId: userId,
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
			expect(replyValue).to.eq("内部エラーが発生したよ！っ");

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

			// Channelテーブルにレコードを作成
			const channelDbId = await createChannelAndGetId(discordChannelId, communityId, DISCORD_TEXT_CHANNEL_TYPE);

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomnotificationchannelcreate", { channelid: discordChannelId }, userId);

			// communityIdとchannelを設定
			when(commandMock.guildId).thenReturn(discordGuildId);
			when(commandMock.channel).thenReturn({} as any);

			// TextChannelを返すようにモック
			when(commandMock.guild).thenReturn({
				ownerId: userId,
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
});
