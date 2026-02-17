import "reflect-metadata";
import { PredefinedRoleImpl, RolePredefinedRoleImpl, RoleRepositoryImpl } from "@/src/repositories/sequelize-mysql";
import { mockSlashCommand, waitUntilReply as waitSlashUntilReply } from "@/tests/fixtures/discord.js/MockSlashCommand";
import { TestDiscordServer } from "@/tests/fixtures/discord.js/TestDiscordServer";
import { expect } from "chai";
import type Mocha from "mocha";
import { anything, instance, when } from "ts-mockito";
import { TEST_GUILD_ID, setupRoleTestEnvironment, teardownRoleTestEnvironment } from "./RoleTestHelpers";

describe("Test RoleBindedByPredefinedRole Commands", () => {
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
	 * [正常系] ロールが正常に事前定義ロールに紐づけられる
	 * - ロールを事前定義ロールに紐づけたよ！っと投稿されること
	 * - RolesPredefinedRolesにデータが作成されること
	 */
	it("should bind role to predefined role successfully", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const roleClientId = "123456789";
			const predefinedRoleId = 1;

			// 管理者ユーザーIDを設定

			// Roleテーブルにレコードを作成
			const role = await RoleRepositoryImpl.create({
				categoryType: 0,
				clientId: BigInt(roleClientId),
				communityId: testCommunityId,
				batchStatus: 0,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand(
				"rolebindedbypredefinedrole",
				{ predefinedrole: predefinedRoleId, roleid: roleClientId },
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

			// データベースにデータが存在しないことを確認
			const beforeData = await RolePredefinedRoleImpl.findAll();
			expect(beforeData.length).to.eq(0);

			// コマンド実行
			const TEST_CLIENT = await TestDiscordServer.getClient();
			TEST_CLIENT.emit("interactionCreate", instance(commandMock));

			// 応答を待つ
			await waitSlashUntilReply(commandMock, 5000);

			// 応答の検証
			expect(replyValue).to.eq("ロールを事前定義ロールに紐づけたよ！っ");

			// データが作られていることを確認
			const afterData = await RolePredefinedRoleImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(Number(afterData[0].roleId)).to.eq(role.id);
			expect(Number(afterData[0].predefinedRolesId)).to.eq(predefinedRoleId);
			expect(afterData[0].deletedAt).to.be.null;
		})();
	});

	/**
	 * [エラー - 既に紐づけられている] 既にロールが事前定義ロールに紐づけられている場合
	 * - このロールは既に事前定義ロールに紐づけられているよ！っと投稿されること
	 * - データが増えないこと
	 */
	it("should return error when role is already bound to predefined role", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const roleClientId = "123456789";
			const predefinedRoleId = 1;

			// 管理者ユーザーIDを設定

			// Roleテーブルにレコードを作成
			const role = await RoleRepositoryImpl.create({
				categoryType: 0,
				clientId: BigInt(roleClientId),
				communityId: testCommunityId,
				batchStatus: 0,
			});

			// 既に紐づけを作成
			await RolePredefinedRoleImpl.create({
				roleId: role.id,
				predefinedRolesId: predefinedRoleId,
			});

			// データベースに既存データが存在することを確認
			const beforeData = await RolePredefinedRoleImpl.findAll();
			expect(beforeData.length).to.eq(1);

			// コマンドのモック作成
			const commandMock = mockSlashCommand(
				"rolebindedbypredefinedrole",
				{ predefinedrole: predefinedRoleId, roleid: roleClientId },
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
			expect(replyValue).to.eq("このロールは既に事前定義ロールに紐づけられているよ！っ");

			// データが増えていないことを確認
			const afterData = await RolePredefinedRoleImpl.findAll();
			expect(afterData.length).to.eq(1);
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
			const predefinedRoleId = 1;
			const UNREGISTERED_GUILD_ID = "9999999999";

			// 管理者ユーザーIDを設定

			// コマンドのモック作成
			const commandMock = mockSlashCommand(
				"rolebindedbypredefinedrole",
				{ predefinedrole: predefinedRoleId, roleid: roleClientId },
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

			// データが作られていないことを確認
			const afterData = await RolePredefinedRoleImpl.findAll();
			expect(afterData.length).to.eq(0);
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
			const predefinedRoleId = 1;

			// 管理者ユーザーIDを設定

			// コマンドのモック作成（ロールは作成しない）
			const commandMock = mockSlashCommand(
				"rolebindedbypredefinedrole",
				{ predefinedrole: predefinedRoleId, roleid: roleClientId },
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

			// データが作られていないことを確認
			const afterData = await RolePredefinedRoleImpl.findAll();
			expect(afterData.length).to.eq(0);
		})();
	});

	/**
	 * [正常系 - 異なる事前定義ロール] 異なる事前定義ロールIDでロールを紐づける
	 * - ロールを事前定義ロールに紐づけたよ！っと投稿されること
	 * - 正しい事前定義ロールIDで紐づけられること
	 */
	it("should bind role to different predefined role successfully", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const roleClientId = "123456789";
			const predefinedRoleId = 2; // admin role

			// 管理者ユーザーIDを設定

			// Roleテーブルにレコードを作成
			const role = await RoleRepositoryImpl.create({
				categoryType: 0,
				clientId: BigInt(roleClientId),
				communityId: testCommunityId,
				batchStatus: 0,
			});

			// コマンドのモック作成
			const commandMock = mockSlashCommand(
				"rolebindedbypredefinedrole",
				{ predefinedrole: predefinedRoleId, roleid: roleClientId },
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
			expect(replyValue).to.eq("ロールを事前定義ロールに紐づけたよ！っ");

			// データが作られていることを確認
			const afterData = await RolePredefinedRoleImpl.findAll();
			expect(afterData.length).to.eq(1);
			expect(Number(afterData[0].roleId)).to.eq(role.id);
			expect(Number(afterData[0].predefinedRolesId)).to.eq(predefinedRoleId);
		})();
	});
});
