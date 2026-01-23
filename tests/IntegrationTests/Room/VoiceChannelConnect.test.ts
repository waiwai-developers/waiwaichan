import type Mocha from "mocha";
import {
	CommunityRepositoryImpl,
	RoomAddChannelRepositoryImpl,
	RoomChannelRepositoryImpl,
	RoomNotificationChannelRepositoryImpl,
	createChannelAndGetId,
	executeVoiceStateTest,
	expect,
	roomTestAfterEach,
	roomTestBeforeEach,
	TestDiscordServer,
	DISCORD_VOICE_CHANNEL_TYPE,
	DISCORD_TEXT_CHANNEL_TYPE,
} from "./RoomTestHelpers";

describe("Test VoiceChannelConnect Events", () => {
	beforeEach(async () => {
		await roomTestBeforeEach();
	});

	afterEach(async () => {
		await roomTestAfterEach();
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
			// 注意: notificationChannelIdにはDiscordのチャンネルID（clientId）を渡す
			const { newState, notificationCapture } = await executeVoiceStateTest({
				communityId: discordGuildId,
				userId,
				oldChannelId: null,
				newChannelId: discordRoomAddChannelId,
				displayName,
				notificationChannelId: discordNotificationChannelId,
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

			// ヘルパー関数を使用してテスト実行（通知チャンネルはDiscordのchannelIdを使用）
			const { newState, notificationCapture } = await executeVoiceStateTest({
				communityId: discordGuildId,
				userId,
				oldChannelId,
				newChannelId: discordRoomAddChannelId,
				displayName,
				notificationChannelId: discordNotificationChannelId,
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

			const { mockVoiceState, addMockTextChannel } = await import("../../fixtures/discord.js/MockVoiceState");
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
			const { mockVoiceState } = await import("../../fixtures/discord.js/MockVoiceState");
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
			const { mockVoiceState } = await import("../../fixtures/discord.js/MockVoiceState");
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

			const { mockVoiceState } = await import("../../fixtures/discord.js/MockVoiceState");
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

			const { mockVoiceState } = await import("../../fixtures/discord.js/MockVoiceState");
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

			const { mockVoiceState } = await import("../../fixtures/discord.js/MockVoiceState");
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

			const { mockVoiceState } = await import("../../fixtures/discord.js/MockVoiceState");
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
			const communityDbId = community!.id;

			// 部屋追加チャンネルをChannelテーブルに登録し、IDを取得
			const roomAddChannelDbId = await createChannelAndGetId(discordRoomAddChannelId, communityDbId, DISCORD_VOICE_CHANNEL_TYPE);

			// 新しく作成されるチャンネル用のChannelレコードを事前に作成（ハンドラがChannelLogic.getIdで検索するため）
			await createChannelAndGetId(predictableCreatedChannelDiscordId, communityDbId, DISCORD_VOICE_CHANNEL_TYPE);

			// RoomAddChannelに登録（ChannelテーブルのIDを使用）
			await RoomAddChannelRepositoryImpl.create({
				communityId: communityDbId,
				channelId: roomAddChannelDbId,
			});

			const { mockVoiceState } = await import("../../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, discordRoomAddChannelId, communityId, userId, displayName, predictableCreatedChannelDiscordId);

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
			const communityDbId = community!.id;

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

			const { mockVoiceState, addMockTextChannel } = await import("../../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, discordRoomAddChannelId, communityId, userId, undefined, predictableCreatedChannelDiscordId);

			let notificationSent = false;
			let notificationContent = "";

			// テキストチャンネルのモックを追加（DiscordのチャンネルIDを渡す）
			addMockTextChannel(newState, discordRoomNotificationChannelId, async (options: any) => {
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
			const communityDbId = community!.id;

			// 部屋追加チャンネルをChannelテーブルに登録
			const roomAddChannelDbId = await createChannelAndGetId(discordRoomAddChannelId, communityDbId, DISCORD_VOICE_CHANNEL_TYPE);

			// 新しく作成されるチャンネル用のChannelレコードを事前に作成（ハンドラがChannelLogic.getIdで検索するため）
			await createChannelAndGetId(predictableCreatedChannelDiscordId, communityDbId, DISCORD_VOICE_CHANNEL_TYPE);

			// 部屋追加チャンネルのみ登録
			await RoomAddChannelRepositoryImpl.create({
				communityId: communityDbId,
				channelId: roomAddChannelDbId,
			});

			const { mockVoiceState } = await import("../../fixtures/discord.js/MockVoiceState");
			const { oldState, newState } = mockVoiceState(null, discordRoomAddChannelId, communityId, userId, undefined, predictableCreatedChannelDiscordId);

			// イベント発火（エラーが発生しないことを確認）
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("voiceStateUpdate", oldState, newState);

			await new Promise((resolve) => setTimeout(resolve, 100));

			// データは作成されていることを確認
			const afterData = await RoomChannelRepositoryImpl.findAll();
			expect(afterData.length).to.be.at.least(1);
		})();
	});
});
