import { appContainer } from "@/src/app.di.config";
import { HandlerTypes, LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import type { ICommandPermissionChecker } from "@/src/handlers/discord.js/permissions/ICommandPermissionChecker";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IPredefinedRoleLogic } from "@/src/logics/Interfaces/logics/IPredefinedRoleLogic";
import {
	CommunityRepositoryImpl,
	PredefinedRoleCommandImpl,
	PredefinedRoleImpl,
	RolePredefinedRoleImpl,
	RoleRepositoryImpl,
} from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";

export const TEST_GUILD_ID = "1234567890" as const;
export const TEST_USER_ID = "test-user-123" as const;
export const TEST_OWNER_ID = "test-owner-456" as const;

export interface TestContext {
	communityId: number;
	checker: ICommandPermissionChecker;
	communityLogic: ICommunityLogic;
	predefinedRoleLogic: IPredefinedRoleLogic;
}

/**
 * データベースの初期化
 */
export function initializeDatabase(): void {
	new MysqlConnector();
}

/**
 * テスト用テーブルのクリーンアップ
 */
export async function cleanupAllTables(): Promise<void> {
	await RolePredefinedRoleImpl.destroy({ truncate: true, force: true });
	await PredefinedRoleCommandImpl.destroy({ truncate: true, force: true });
	await PredefinedRoleImpl.destroy({ truncate: true, force: true });
	await RoleRepositoryImpl.destroy({ truncate: true, force: true });
	await CommunityRepositoryImpl.destroy({ truncate: true, force: true });
}

/**
 * テスト環境のセットアップ
 */
export async function setupTestEnvironment(): Promise<TestContext> {
	initializeDatabase();
	await cleanupAllTables();

	// Communityの作成
	const community = await CommunityRepositoryImpl.create({
		categoryType: CommunityCategoryType.Discord.getValue(),
		clientId: BigInt(TEST_GUILD_ID),
		batchStatus: 0,
	});

	// DIコンテナから各サービスを取得
	const checker = appContainer.get<ICommandPermissionChecker>(HandlerTypes.CommandPermissionChecker);
	const communityLogic = appContainer.get<ICommunityLogic>(LogicTypes.CommunityLogic);
	const predefinedRoleLogic = appContainer.get<IPredefinedRoleLogic>(LogicTypes.PredefinedRoleLogic);

	return {
		communityId: community.id,
		checker,
		communityLogic,
		predefinedRoleLogic,
	};
}

/**
 * テスト環境のクリーンアップ
 */
export async function teardownTestEnvironment(): Promise<void> {
	await cleanupAllTables();
}
