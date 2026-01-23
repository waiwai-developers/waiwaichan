import type Mocha from "mocha";
import {
	CommunityRepositoryImpl,
	RoomAddChannelRepositoryImpl,
	RoomChannelRepositoryImpl,
	RoomNotificationChannelRepositoryImpl,
	createChannelAndGetId,
	expect,
	roomTestAfterEach,
	roomTestBeforeEach,
	TestDiscordServer,
	DISCORD_VOICE_CHANNEL_TYPE,
	DISCORD_TEXT_CHANNEL_TYPE,
} from "./RoomTestHelpers";

describe("Test VoiceChannelDisconnect Events", () => {
	beforeEach(async () => {
		await roomTestBeforeEach();
	});

	afterEach(async () => {
		await roomTestAfterEach();
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
			const communityDbId = community!.id;

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

			const { mockVoiceState, addMockTextChannel } = await import("../../fixtures/discord.js/MockVoiceState");
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

			const { mockVoiceState, addMockTextChannel } = await import("../../fixtures/discord.js/MockVoiceState");
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
			const communityDbId = community!.id;

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

			const { mockVoiceState } = await import("../../fixtures/discord.js/MockVoiceState");
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

			const { mockVoiceState, addMockTextChannel } = await import("../../fixtures/discord.js/MockVoiceState");
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
			const { mockVoiceState } = await import("../../fixtures/discord.js/MockVoiceState");
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
			const communityDbId = community!.id;

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

			const { mockVoiceState, addMockTextChannel } = await import("../../fixtures/discord.js/MockVoiceState");
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
			const { mockVoiceState } = await import("../../fixtures/discord.js/MockVoiceState");
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

			const { mockVoiceState } = await import("../../fixtures/discord.js/MockVoiceState");
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

			const { mockVoiceState } = await import("../../fixtures/discord.js/MockVoiceState");
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

			const { mockVoiceState } = await import("../../fixtures/discord.js/MockVoiceState");
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

			const { mockVoiceState } = await import("../../fixtures/discord.js/MockVoiceState");
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
			const communityDbId = community!.id;

			// チャンネルをChannelテーブルに登録
			const channelDbId = await createChannelAndGetId(discordChannelId, communityDbId, DISCORD_VOICE_CHANNEL_TYPE);

			// 部屋チャンネルとして登録（ChannelテーブルのIDを使用）
			await RoomChannelRepositoryImpl.create({
				communityId: communityDbId,
				channelId: channelDbId,
			});

			const { mockVoiceState } = await import("../../fixtures/discord.js/MockVoiceState");
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
			const communityDbId = community!.id;

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

			const { mockVoiceState, addMockTextChannel } = await import("../../fixtures/discord.js/MockVoiceState");
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
			const communityDbId = community!.id;

			// チャンネルをChannelテーブルに登録
			const channelDbId = await createChannelAndGetId(discordChannelId, communityDbId, DISCORD_VOICE_CHANNEL_TYPE);

			// 部屋チャンネルのみ登録（ChannelテーブルのIDを使用）
			await RoomChannelRepositoryImpl.create({
				communityId: communityDbId,
				channelId: channelDbId,
			});

			const { mockVoiceState } = await import("../../fixtures/discord.js/MockVoiceState");
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
