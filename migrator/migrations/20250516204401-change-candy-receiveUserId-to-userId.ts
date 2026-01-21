import type { Migration } from "@/migrator/umzug";

const TABLE_NAME = "Candies";
const COLUMN_NAME_1 = "receiveUserId";
const COLUMN_NAME_2 = "userId";

// アップマイグレーション： receiveUserId → userId にリネーム！
export const up: Migration = async ({ context: sequelize }) => {
	await sequelize
		.getQueryInterface()
		.renameColumn(TABLE_NAME, COLUMN_NAME_1, COLUMN_NAME_2);
};

// ダウンマイグレーション： userId → receiveUserId に戻す
export const down: Migration = async ({ context: sequelize }) => {
	await sequelize
		.getQueryInterface()
		.renameColumn(TABLE_NAME, COLUMN_NAME_2, COLUMN_NAME_1);
};
