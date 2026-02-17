import type Mocha from "mocha";
import {
	RoleConfig,
	RoomCategoryChannelRepositoryImpl,
	TestDiscordServer,
	anything,
	expect,
	instance,
	mockSlashCommand,
	roomTestAfterEach,
	roomTestBeforeEach,
	waitUntilReply,
	when,
} from "./RoomTestHelpers";

describe("Test RoomCategoryChannelDelete Commands", () => {
	beforeEach(async () => {
		await roomTestBeforeEach();
	});

	afterEach(async () => {
		await roomTestAfterEach();
	});

	/**
	 * RoomCategoryChannelDeleteCommandHandlerのテスト
	 */

	/**
	 * [存在チェック - データなし] サーバーにRoomCategoryChannelsデータがない状況で実行した時
	 * - カテゴリーチャンネルが登録されていなかったよ！っと投稿されること
	 */
	it("should not delete room category channel when no data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const userId = "3";

			// 管理者ユーザーIDを設定

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomcategorychanneldelete", {}, userId);

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
			const beforeData = await RoomCategoryChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 10_000);

			// 応答の検証
			expect(replyValue).to.eq("カテゴリーチャンネルが登録されていなかったよ！っ");

			// データベースにデータが存在しないことを再確認
			const afterData = await RoomCategoryChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);
		})();
	});

	/**
	 * [正常削除] サーバーにRoomCategoryChannelsデータがdeletedAtがnullである状況で実行した時
	 * - カテゴリーチャンネルを削除したよ！っと投稿されること
	 * - RoomCategoryChannelsのデータのdeletedAtに値が入ること
	 */
	it("should delete room category channel successfully", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定

			// 既存のデータを作成
			await RoomCategoryChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: channelId,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomcategorychanneldelete", {}, userId);

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
			const beforeData = await RoomCategoryChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(1);
			expect(beforeData[0].deletedAt).to.be.null;

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("カテゴリーチャンネルを削除したよ！っ");

			// データが論理削除されていることを確認（findAllでは取得できない）
			const afterData = await RoomCategoryChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);

			// paranoid: falseで削除済みデータを取得して確認
			const deletedData = await RoomCategoryChannelRepositoryImpl.findAll({
				paranoid: false,
			});
			expect(deletedData.length).to.eq(1);
			expect(deletedData[0].deletedAt).to.not.be.null;
		})();
	});

	/**
	 * [存在チェック - deletedAtあり] サーバーにRoomCategoryChannelsデータがdeletedAtがnullでない状況で実行した時
	 * - カテゴリーチャンネルが登録されていなかったよ！っと投稿されること
	 */
	it("should not delete room category channel when already deleted", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const communityId = "1";
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定

			// 削除済みのデータを作成
			const deletedData = await RoomCategoryChannelRepositoryImpl.create({
				communityId: communityId,
				channelId: channelId,
			});
			await deletedData.destroy();

			// コマンドのモック作成
			const commandMock = mockSlashCommand("roomcategorychanneldelete", {}, userId);

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
			const beforeData = await RoomCategoryChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitUntilReply(commandMock, 5000);

			// 応答の検証
			expect(replyValue).to.eq("カテゴリーチャンネルが登録されていなかったよ！っ");
		})();
	});
});
