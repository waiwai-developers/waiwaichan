import "reflect-metadata";
import { CommandCategoryType } from "@/src/entities/vo/CommandCategoryType";
import {
	PredefinedRoleCommandImpl,
	PredefinedRoleImpl,
	RolePredefinedRoleImpl,
	RoleRepositoryImpl,
} from "@/src/repositories/sequelize-mysql";
import { mockSlashCommand } from "@/tests/fixtures/discord.js/MockSlashCommand";
import {
	TEST_GUILD_ID,
	TEST_OWNER_ID,
	TEST_USER_ID,
	type TestContext,
	setupTestEnvironment,
	teardownTestEnvironment,
} from "@/tests/IntegrationTests/Permission/CommandPermissionCheckerTestHelpers";
import { expect } from "chai";
import type { GuildMember } from "discord.js";
import type Mocha from "mocha";
import { instance, when } from "ts-mockito";

describe("CommandPermissionChecker Integration Tests", () => {
	let testContext: TestContext;

	beforeEach(async () => {
		testContext = await setupTestEnvironment();
	});

	afterEach(async () => {
		await teardownTestEnvironment();
	});

	/**
	 * [エラー - guildIdなし] guildIdがnullの場合にエラーメッセージを返すこと
	 */
	it("should return error when guildId is null", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const commandMock = mockSlashCommand("help", {}, { userId: TEST_USER_ID, withMember: false });
			when(commandMock.guildId).thenReturn(null as any);
			when(commandMock.member).thenReturn({} as any);

			const result = await testContext.checker.checkPermission(instance(commandMock), "help");

			expect(result.isSuccess).to.be.false;
			expect(result.errorMessage).to.eq("このコマンドはサーバー内でのみ実行できるよ！っ");
			expect(result.communityId).to.be.undefined;
		})();
	});

	/**
	 * [エラー - memberなし] memberがnullの場合にエラーメッセージを返すこと
	 */
	it("should return error when member is null", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const commandMock = mockSlashCommand("help", {}, { userId: TEST_USER_ID, guildId: TEST_GUILD_ID, withMember: false });
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.member).thenReturn(null as any);

			const result = await testContext.checker.checkPermission(instance(commandMock), "help");

			expect(result.isSuccess).to.be.false;
			expect(result.errorMessage).to.eq("このコマンドはサーバー内でのみ実行できるよ！っ");
			expect(result.communityId).to.be.undefined;
		})();
	});

	/**
	 * [エラー - コミュニティ未登録] コミュニティが登録されていない場合にエラーメッセージを返すこと
	 */
	it("should return error when community is not registered", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const UNREGISTERED_GUILD_ID = "9999999999";
			const commandMock = mockSlashCommand("help", {}, TEST_USER_ID, UNREGISTERED_GUILD_ID);
			when(commandMock.guildId).thenReturn(UNREGISTERED_GUILD_ID);
			when(commandMock.member).thenReturn({
				roles: { cache: new Map() },
			} as any);

			const result = await testContext.checker.checkPermission(instance(commandMock), "help");

			expect(result.isSuccess).to.be.false;
			expect(result.errorMessage).to.eq("コミュニティが登録されていなかったよ！っ");
			expect(result.communityId).to.be.undefined;
		})();
	});

	/**
	 * [成功 - ギルドオーナー] ギルドオーナーの場合は権限チェックをスキップして成功すること
	 */
	it("should succeed for guild owner without permission check", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const commandMock = mockSlashCommand("help", {}, TEST_OWNER_ID, TEST_GUILD_ID);
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.member).thenReturn({
				roles: { cache: new Map() },
			} as any);
			when(commandMock.guild).thenReturn({
				ownerId: TEST_OWNER_ID,
			} as any);
			when(commandMock.user).thenReturn({
				id: TEST_OWNER_ID,
			} as any);

			const result = await testContext.checker.checkPermission(instance(commandMock), "help");

			expect(result.isSuccess).to.be.true;
			expect(result.communityId).to.not.be.undefined;
			expect(result.errorMessage).to.be.undefined;
		})();
	});

	/**
	 * [エラー - コマンド情報なし] コマンド情報が見つからない場合にエラーメッセージを返すこと
	 */
	it("should return error when command info is not found", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			const rolesMap = new Map();
			const commandMock = mockSlashCommand("help", {}, TEST_USER_ID, TEST_GUILD_ID);
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.member).thenReturn({
				roles: {
					cache: {
						map: (fn: any) => Array.from(rolesMap.values()).map(fn),
					},
				},
			} as any);
			when(commandMock.guild).thenReturn({
				ownerId: TEST_OWNER_ID,
			} as any);
			when(commandMock.user).thenReturn({
				id: TEST_USER_ID,
			} as any);

			const result = await testContext.checker.checkPermission(instance(commandMock), "nonexistent_command");

			expect(result.isSuccess).to.be.false;
			expect(result.errorMessage).to.eq("コマンド情報が見つからなかったよ！っ");
			expect(result.communityId).to.be.undefined;
		})();
	});

	/**
	 * [エラー - 権限なし] ユーザーがコマンドを実行する権限を持っていない場合にエラーメッセージを返すこと
	 */
	it("should return error when user has no permission", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// テスト用のロールとPredefinedRoleを作成するが、権限を付与しない
			const role = await RoleRepositoryImpl.create({
				categoryType: 0,
				clientId: BigInt("123"),
				communityId: testContext.communityId,
				batchStatus: 0,
			});

			const predefinedRole = await PredefinedRoleImpl.create({
				name: "TestRole",
			});

			await RolePredefinedRoleImpl.create({
				roleId: role.id,
				predefinedRolesId: predefinedRole.id,
			});

			// コマンド権限を作成（許可しない）
			await PredefinedRoleCommandImpl.create({
				predefinedRolesId: predefinedRole.id,
				commandCategoryType: CommandCategoryType.Utility.getValue(),
				commandType: 1, // help command
				isAllow: false, // 権限なし
			});

			const rolesMap = new Map([["123", { id: "123" }]]);
			const commandMock = mockSlashCommand("help", {}, TEST_USER_ID, TEST_GUILD_ID);
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.member).thenReturn({
				roles: {
					cache: {
						map: (fn: any) => Array.from(rolesMap.values()).map(fn),
					},
				},
			} as GuildMember);
			when(commandMock.guild).thenReturn({
				ownerId: TEST_OWNER_ID,
			} as any);
			when(commandMock.user).thenReturn({
				id: TEST_USER_ID,
			} as any);

			const result = await testContext.checker.checkPermission(instance(commandMock), "help");

			expect(result.isSuccess).to.be.false;
			expect(result.errorMessage).to.eq("このコマンドを実行する権限がないよ！っ");
			expect(result.communityId).to.be.undefined;
		})();
	});

	/**
	 * [成功 - 権限あり] ユーザーがコマンドを実行する権限を持っている場合に成功すること
	 */
	it("should succeed when user has permission", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// テスト用のロールとPredefinedRoleを作成し、権限を付与
			const role = await RoleRepositoryImpl.create({
				categoryType: 0,
				clientId: BigInt("456"),
				communityId: testContext.communityId,
				batchStatus: 0,
			});

			const predefinedRole = await PredefinedRoleImpl.create({
				name: "AdminRole",
			});

			await RolePredefinedRoleImpl.create({
				roleId: role.id,
				predefinedRolesId: predefinedRole.id,
			});

			// コマンド権限を作成（許可する）
			await PredefinedRoleCommandImpl.create({
				predefinedRolesId: predefinedRole.id,
				commandCategoryType: CommandCategoryType.Utility.getValue(),
				commandType: 1, // help command
				isAllow: true, // 権限あり
			});

			const rolesMap = new Map([["456", { id: "456" }]]);
			const commandMock = mockSlashCommand("help", {}, TEST_USER_ID, TEST_GUILD_ID);
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.member).thenReturn({
				roles: {
					cache: {
						map: (fn: any) => Array.from(rolesMap.values()).map(fn),
					},
				},
			} as GuildMember);
			when(commandMock.guild).thenReturn({
				ownerId: TEST_OWNER_ID,
			} as any);
			when(commandMock.user).thenReturn({
				id: TEST_USER_ID,
			} as any);

			const result = await testContext.checker.checkPermission(instance(commandMock), "help");

			expect(result.isSuccess).to.be.true;
			expect(result.communityId).to.not.be.undefined;
			expect(result.errorMessage).to.be.undefined;
		})();
	});

	/**
	 * [成功 - 複数ロール] 複数のロールを持つユーザーで、いずれかのロールに権限がある場合に成功すること
	 */
	it("should succeed when user has multiple roles and one has permission", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// 権限のないロール
			const role1 = await RoleRepositoryImpl.create({
				categoryType: 0,
				clientId: BigInt("111"),
				communityId: testContext.communityId,
				batchStatus: 0,
			});

			const predefinedRole1 = await PredefinedRoleImpl.create({
				name: "NoPermRole",
			});

			await RolePredefinedRoleImpl.create({
				roleId: role1.id,
				predefinedRolesId: predefinedRole1.id,
			});

			await PredefinedRoleCommandImpl.create({
				predefinedRolesId: predefinedRole1.id,
				commandCategoryType: CommandCategoryType.Utility.getValue(),
				commandType: 1,
				isAllow: false,
			});

			// 権限のあるロール
			const role2 = await RoleRepositoryImpl.create({
				categoryType: 0,
				clientId: BigInt("222"),
				communityId: testContext.communityId,
				batchStatus: 0,
			});

			const predefinedRole2 = await PredefinedRoleImpl.create({
				name: "PermRole",
			});

			await RolePredefinedRoleImpl.create({
				roleId: role2.id,
				predefinedRolesId: predefinedRole2.id,
			});

			await PredefinedRoleCommandImpl.create({
				predefinedRolesId: predefinedRole2.id,
				commandCategoryType: CommandCategoryType.Utility.getValue(),
				commandType: 1,
				isAllow: true,
			});

			const rolesMap = new Map([
				["111", { id: "111" }],
				["222", { id: "222" }],
			]);
			const commandMock = mockSlashCommand("help", {}, TEST_USER_ID, TEST_GUILD_ID);
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.member).thenReturn({
				roles: {
					cache: {
						map: (fn: any) => Array.from(rolesMap.values()).map(fn),
					},
				},
			} as GuildMember);
			when(commandMock.guild).thenReturn({
				ownerId: TEST_OWNER_ID,
			} as any);
			when(commandMock.user).thenReturn({
				id: TEST_USER_ID,
			} as any);

			const result = await testContext.checker.checkPermission(instance(commandMock), "help");

			expect(result.isSuccess).to.be.true;
			expect(result.communityId).to.not.be.undefined;
			expect(result.errorMessage).to.be.undefined;
		})();
	});

	/**
	 * [成功 - 異なるコマンド] 異なるカテゴリ・タイプのコマンドに対して正しく権限チェックが行われること
	 */
	it("should check permission correctly for different command types", function (this: Mocha.Context) {
		this.timeout(10_000);

		return (async () => {
			// Candyカテゴリのコマンドに権限を持つロールを作成
			const role = await RoleRepositoryImpl.create({
				categoryType: 0,
				clientId: BigInt("789"),
				communityId: testContext.communityId,
				batchStatus: 0,
			});

			const predefinedRole = await PredefinedRoleImpl.create({
				name: "CandyRole",
			});

			await RolePredefinedRoleImpl.create({
				roleId: role.id,
				predefinedRolesId: predefinedRole.id,
			});

			// Candyコマンドには権限あり
			await PredefinedRoleCommandImpl.create({
				predefinedRolesId: predefinedRole.id,
				commandCategoryType: CommandCategoryType.Candy.getValue(),
				commandType: 1, // candycheck
				isAllow: true,
			});

			// Utilityコマンドには権限なし
			await PredefinedRoleCommandImpl.create({
				predefinedRolesId: predefinedRole.id,
				commandCategoryType: CommandCategoryType.Utility.getValue(),
				commandType: 1, // help
				isAllow: false,
			});

			const rolesMap = new Map([["789", { id: "789" }]]);
			const commandMock = mockSlashCommand("candycheck", {}, TEST_USER_ID, TEST_GUILD_ID);
			when(commandMock.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock.member).thenReturn({
				roles: {
					cache: {
						map: (fn: any) => Array.from(rolesMap.values()).map(fn),
					},
				},
			} as GuildMember);
			when(commandMock.guild).thenReturn({
				ownerId: TEST_OWNER_ID,
			} as any);
			when(commandMock.user).thenReturn({
				id: TEST_USER_ID,
			} as any);

			// Candyコマンドは成功するはず
			const resultCandy = await testContext.checker.checkPermission(instance(commandMock), "candycheck");

			expect(resultCandy.isSuccess).to.be.true;
			expect(resultCandy.communityId).to.not.be.undefined;

			// Utilityコマンドは失敗するはず
			const rolesMap2 = new Map([["789", { id: "789" }]]);
			const commandMock2 = mockSlashCommand("help", {}, TEST_USER_ID, TEST_GUILD_ID);
			when(commandMock2.guildId).thenReturn(TEST_GUILD_ID);
			when(commandMock2.member).thenReturn({
				roles: {
					cache: {
						map: (fn: any) => Array.from(rolesMap2.values()).map(fn),
					},
				},
			} as GuildMember);
			when(commandMock2.guild).thenReturn({
				ownerId: TEST_OWNER_ID,
			} as any);
			when(commandMock2.user).thenReturn({
				id: TEST_USER_ID,
			} as any);

			const resultHelp = await testContext.checker.checkPermission(instance(commandMock2), "help");

			expect(resultHelp.isSuccess).to.be.false;
			expect(resultHelp.errorMessage).to.eq("このコマンドを実行する権限がないよ！っ");
		})();
	});
});
