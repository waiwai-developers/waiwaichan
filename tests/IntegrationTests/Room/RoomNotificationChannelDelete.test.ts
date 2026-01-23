import type Mocha from "mocha";
import {
	RoleConfig,
	RoomNotificationChannelRepositoryImpl,
	TestDiscordServer,
	anything,
	createCommandMock,
	executeCommandAndWait,
	expect,
	instance,
	mockSlashCommand,
	roomTestAfterEach,
	roomTestBeforeEach,
	setupRoleConfig,
	waitUntilReply,
	when,
} from "./RoomTestHelpers";

describe("Test RoomNotificationChannelDelete Commands", () => {
	beforeEach(async () => {
		await roomTestBeforeEach();
	});

	afterEach(async () => {
		await roomTestAfterEach();
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
});
