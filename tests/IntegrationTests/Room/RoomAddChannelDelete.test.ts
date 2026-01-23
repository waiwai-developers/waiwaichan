import type Mocha from "mocha";
import {
	RoomAddChannelRepositoryImpl,
	createCommandMock,
	executeCommandAndWait,
	expect,
	roomTestAfterEach,
	roomTestBeforeEach,
	setupRoleConfig,
} from "./RoomTestHelpers";

describe("Test RoomAddChannelDelete Commands", () => {
	beforeEach(async () => {
		await roomTestBeforeEach();
	});

	afterEach(async () => {
		await roomTestAfterEach();
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
});
