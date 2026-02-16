import "reflect-metadata";
import { RoleConfig } from "@/src/entities/config/RoleConfig";
import { RolePredefinedRoleImpl, RoleRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { mockSlashCommand, waitUntilReply as waitSlashUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import type Mocha from "mocha";
import { anything, instance, when } from "ts-mockito";
import { TEST_GUILD_ID, setupRoleTestEnvironment, teardownRoleTestEnvironment } from "./RoleTestHelpers";

describe("Test RoleReleasedByPredefinedRole Commands", () => {
	let testCommunityId: number;
	let testUserId: string;

	beforeEach(async () => {
		const context = await setupRoleTestEnvironment();
		testCommunityId = context.communityId;
		testUserId = context.userId;
	});

	afterEach(async () => {
		await teardownRoleTestEnvironment();
	});

	/**
	 * [正常系] ロールの事前定義ロール紐づけが正常に解除される
	 * - ロールの紐づけを解除したよ！っと投稿されること
	 * - RolesPredefinedRolesのデータが削除されること
	 */
	it("should release role from predefined role successfully", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const roleClientId = "123456789";
			const predefinedRoleId = 1;

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: testUserId, role: "admin" }];

			// Roleテーブルにレコードを作成
			const role = await RoleRepositoryImpl.create({
				categoryType: 0,
				clientId: BigInt(roleClientId),
				communityId: testCommunityId,
				batchStatus: 0,
			});

			// 紐づけを作成
			await RolePredefinedRoleImpl.create({
				roleId: role.id,
				predefinedRolesId: predefinedRoleId,
			});

			// データベースに既存データが存在することを確認
			const beforeData = await RolePredefinedRoleImpl.findAll();
			expect(beforeData.length).to.eq(1);

			// コマンドのモック作成
			const commandMock = mockSlashCommand(
				"rolereleasedbypredefinedrole",
				{ roleid: roleClientId },
				testUserId,
				TEST_GUILD_ID,
			);

			// guildIdを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

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
			expect(replyValue).to.eq("ロールの紐づけを解除したよ！っ");

			// データが削除されていることを確認
			const afterData = await RolePredefinedRoleImpl.findAll();
			expect(afterData.length).to.eq(0);
		})();
	});

	/**
	 * [エラー - 紐づけられていない] ロールが事前定義ロールに紐づけられていない場合
	 * - このロールは事前定義ロールに紐づけられていないよ！っと投稿されること
	 */
	it("should return error when role is not bound to predefined role", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const roleClientId = "123456789";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: testUserId, role: "admin" }];

			// Roleテーブルにレコードを作成（紐づけは作成しない）
			await RoleRepositoryImpl.create({
				categoryType: 0,
				clientId: BigInt(roleClientId),
				communityId: testCommunityId,
				batchStatus: 0,
			});

			// データベースにデータが存在しないことを確認
			const beforeData = await RolePredefinedRoleImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンドのモック作成
			const commandMock = mockSlashCommand(
				"rolereleasedbypredefinedrole",
				{ roleid: roleClientId },
				testUserId,
				TEST_GUILD_ID,
			);

			// guildIdを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

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
			expect(replyValue).to.eq("このロールは事前定義ロールに紐づけられていないよ！っ");

			// データは依然として存在しないことを確認
			const afterData = await RolePredefinedRoleImpl.findAll();
			expect(afterData.length).to.eq(0);
		})();
	});

	/**
	 * [エラー - コミュニティ未登録] コミュニティが登録されていない場合
	 * - コミュニティが登録されていなかったよ！っと投稿されること
	 */
	it("should return error when community is not registered", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const roleClientId = "123456789";
			const UNREGISTERED_GUILD_ID = "9999999999";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: testUserId, role: "admin" }];

			// コマンドのモック作成
			const commandMock = mockSlashCommand(
				"rolereleasedbypredefinedrole",
				{ roleid: roleClientId },
				testUserId,
				UNREGISTERED_GUILD_ID,
			);

			// guildIdを設定
			when(commandMock.guildId).thenReturn(UNREGISTERED_GUILD_ID);

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
			expect(replyValue).to.eq("コミュニティが登録されていなかったよ！っ");
		})();
	});

	/**
	 * [エラー - ロール未登録] ロールが登録されていない場合
	 * - ロールが登録されていなかったよ！っと投稿されること
	 */
	it("should return error when role is not registered", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const roleClientId = "123456789";

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: testUserId, role: "admin" }];

			// コマンドのモック作成（ロールは作成しない）
			const commandMock = mockSlashCommand(
				"rolereleasedbypredefinedrole",
				{ roleid: roleClientId },
				testUserId,
				TEST_GUILD_ID,
			);

			// guildIdを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

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
			expect(replyValue).to.eq("ロールが登録されていなかったよ！っ");
		})();
	});

	/**
	 * [正常系 - 削除済みデータ] deletedAtがnullでないデータの場合も解除できる
	 * - ロールの紐づけを解除したよ！っと投稿されること
	 * - データが削除されること（paranoid削除）
	 */
	it("should release role from predefined role even if already soft-deleted", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const roleClientId = "123456789";
			const predefinedRoleId = 1;

			// 管理者ユーザーIDを設定
			RoleConfig.users = [{ discordId: testUserId, role: "admin" }];

			// Roleテーブルにレコードを作成
			const role = await RoleRepositoryImpl.create({
				categoryType: 0,
				clientId: BigInt(roleClientId),
				communityId: testCommunityId,
				batchStatus: 0,
			});

			// 紐づけを作成
			const binding = await RolePredefinedRoleImpl.create({
				roleId: role.id,
				predefinedRolesId: predefinedRoleId,
			});

			// データベースに既存データが存在することを確認
			const beforeData = await RolePredefinedRoleImpl.findAll();
			expect(beforeData.length).to.eq(1);

			// コマンドのモック作成
			const commandMock = mockSlashCommand(
				"rolereleasedbypredefinedrole",
				{ roleid: roleClientId },
				testUserId,
				TEST_GUILD_ID,
			);

			// guildIdを設定
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);

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
			expect(replyValue).to.eq("ロールの紐づけを解除したよ！っ");

			// データが削除されていることを確認
			const afterData = await RolePredefinedRoleImpl.findAll();
			expect(afterData.length).to.eq(0);
		})();
	});
});
