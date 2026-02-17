import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import {
	CommunityRepositoryImpl,
	PredefinedRoleCommandImpl,
	PredefinedRoleImpl,
	RolePredefinedRoleImpl,
	RoleRepositoryImpl,
} from "@/src/repositories/sequelize-mysql";
import { MysqlConnector } from "@/tests/fixtures/database/MysqlConnector";

export const TEST_GUILD_ID = "1234567890" as const;

export interface TestContext {
	communityId: number;
	userId: string;
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
export async function setupRoleTestEnvironment(): Promise<TestContext> {
	initializeDatabase();
	await cleanupAllTables();

	// Communityの作成
	const community = await CommunityRepositoryImpl.create({
		categoryType: CommunityCategoryType.Discord.getValue(),
		clientId: BigInt(TEST_GUILD_ID),
		batchStatus: 0,
	});

	return {
		communityId: community.id,
		userId: "test-user-123",
	};
}

/**
 * テスト環境のクリーンアップ
 */
export async function teardownRoleTestEnvironment(): Promise<void> {
	await cleanupAllTables();
}
