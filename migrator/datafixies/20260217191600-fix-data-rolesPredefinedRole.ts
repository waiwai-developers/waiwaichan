import type { Datafix } from "@/migrator/umzug";
import { DatafixRolesPredefinedRolesModel } from "./models/DatafixRolesPredefinedRolesModel";

export const up: Datafix = async ({ context: sequelize }) => {
	// RolesPredefinedRolesテーブルの全データのcommunityIdを1に更新
	await DatafixRolesPredefinedRolesModel.update(
		{ communityId: 1 },
		{ where: {} },
	);
};

export const down: Datafix = async ({ context: sequelize }) => {
	// ダウンマイグレーションは実装しない（元のデータが不明なため）
};
