import type Mocha from "mocha";
import {
	RoomAddChannelRepositoryImpl,
	RoomAddChannelTestHelper,
	createChannelAndGetId,
	createCommandMock,
	executeCommandAndWait,
	expect,
	roomTestAfterEach,
	roomTestBeforeEach,
	setupGuildChannelMock,
	setupRoleConfig,
	DISCORD_VOICE_CHANNEL_TYPE,
} from "./RoomTestHelpers";

describe("Test RoomAddChannelCreate Commands", () => {
	beforeEach(async () => {
		await roomTestBeforeEach();
	});

	afterEach(async () => {
		await roomTestAfterEach();
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
});
