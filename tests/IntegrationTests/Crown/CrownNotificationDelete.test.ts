import "reflect-metadata";
import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { CrownNotificationChannelRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { mockSlashCommand, waitUntilReply as waitSlashUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import type Mocha from "mocha";
import { anything, instance, when } from "ts-mockito";
import { cleanupCrownTest, setupCrownTest } from "./CrownTestHelper";

const TEST_GUILD_ID = "1234567890";

async function setupTestEnvironment(): Promise<{ communityId: number }> {
	const { CommunityRepositoryImpl } = await import("@/src/repositories/sequelize-mysql");

	const community = await CommunityRepositoryImpl.create({
		categoryType: 0,
		clientId: BigInt(TEST_GUILD_ID),
		batchStatus: 0,
	});

	return {
		communityId: community.id,
	};
}

describe("Test CrownNotificationChannelDelete Commands", () => {
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
	 * CrownNotificationChannelDeleteCommandHandlerのテスト
	 */

	/**
	 * [存在チェック - データなし] サーバーにCrownNotificationChannelsデータがない状況で実行した時
	 * - クラウン通知チャンネルが登録されていなかったよ！っと投稿されること
	 */
	it("should not delete crown notification channel when no data exists", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// コマンドのモック作成
			const commandMock = mockSlashCommand("crownnotificationchanneldelete", {}, userId, TEST_GUILD_ID);

			// guildを設定（ownerIdを設定して権限を付与）
			when(commandMock.guild).thenReturn({
				id: TEST_GUILD_ID,
				ownerId: userId, // ユーザーをオーナーに設定
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
			await waitSlashUntilReply(commandMock, 10_000);

			// 応答の検証
			expect(replyValue).to.eq("クラウン通知チャンネルが登録されていなかったよ！っ");

			// データベースにデータが存在しないことを再確認
			const afterData = await CrownNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);
		})();
	});

	/**
	 * [正常削除] サーバーにCrownNotificationChannelsデータがdeletedAtがnullである状況で実行した時
	 * - クラウン通知チャンネルを削除したよ！っと投稿されること
	 * - CrownNotificationChannelsのデータのdeletedAtに値が入ること
	 */
	it("should delete crown notification channel successfully", function (this: Mocha.Context) {
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
			const commandMock = mockSlashCommand("crownnotificationchanneldelete", {}, userId, TEST_GUILD_ID);

			// guildを設定（ownerIdを設定して権限を付与）
			when(commandMock.guild).thenReturn({
				id: TEST_GUILD_ID,
				ownerId: userId, // ユーザーをオーナーに設定
			} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにデータが存在することを確認
			const beforeData = await CrownNotificationChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(1);
			expect(beforeData[0].deletedAt).to.be.null;

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitSlashUntilReply(commandMock, 1000);

			// 応答の検証
			expect(replyValue).to.eq("クラウン通知チャンネルを削除したよ！っ");

			// データが論理削除されていることを確認（findAllでは取得できない）
			const afterData = await CrownNotificationChannelRepositoryImpl.findAll();
			expect(afterData.length).to.eq(0);

			// paranoid: falseで削除済みデータを取得して確認
			const deletedData = await CrownNotificationChannelRepositoryImpl.findAll({
				paranoid: false,
			});
			expect(deletedData.length).to.eq(1);
			expect(deletedData[0].deletedAt).to.not.be.null;
		})();
	});

	/**
	 * [存在チェック - deletedAtあり] サーバーにCrownNotificationChannelsデータがdeletedAtがnullでない状況で実行した時
	 * - クラウン通知チャンネルが登録されていなかったよ！っと投稿されること
	 */
	it("should not delete crown notification channel when already deleted", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const channelId = "2";
			const userId = "3";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: userId, role: "admin" }];

			// 削除済みのデータを作成
			const deletedData = await CrownNotificationChannelRepositoryImpl.create({
				communityId: testCommunityId,
				channelId: channelId,
			});
			await deletedData.destroy();

			// コマンドのモック作成
			const commandMock = mockSlashCommand("crownnotificationchanneldelete", {}, userId, TEST_GUILD_ID);

			// guildを設定（ownerIdを設定して権限を付与）
			when(commandMock.guild).thenReturn({
				id: TEST_GUILD_ID,
				ownerId: userId, // ユーザーをオーナーに設定
			} as any);

			// replyメソッドをモック
			let replyValue = "";
			when(commandMock.reply(anything())).thenCall((message: string) => {
				replyValue = message;
				return Promise.resolve({} as any);
			});

			// データベースにアクティブなデータが存在しないことを確認
			const beforeData = await CrownNotificationChannelRepositoryImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitSlashUntilReply(commandMock, 5000);

			// 応答の検証
			expect(replyValue).to.eq("クラウン通知チャンネルが登録されていなかったよ！っ");
		})();
	});
});
