import type { Datafix } from "@/migrator/umzug";
import { DatafixCrownModel } from "./models/DatafixCrownModel";

export const up: Datafix = async ({ context: sequelize }) => {
	// Crownテーブルの全てのレコードのcommunityIdを1に更新
	await DatafixCrownModel.update(
		{ communityId: 1 },
		{ where: {} }, // 全てのレコードを対象
	);

	console.log("All Crown records have been updated with communityId = 1");
};

export const down: Datafix = async ({ context: sequelize }) => {
	// ロールバック処理（communityIdをNULLに戻す）
	await DatafixCrownModel.update(
		{ communityId: null },
		{ where: {} },
	);

	console.log("All Crown records have been rolled back (communityId = null)");
};
