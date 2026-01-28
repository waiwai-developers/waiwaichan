import type { Migration } from "@/migrator/umzug";
import { DataTypes } from "sequelize";

const TABLE_NAME = "Crowns";
const COLUMN_NAME = "deletedAt";

export const up: Migration = async ({ context: sequelize }) => {
	// CrownsテーブルにdeletedAtカラムを追加する（null許可）
	await sequelize.getQueryInterface().addColumn(TABLE_NAME, COLUMN_NAME, {
		type: DataTypes.DATE,
		allowNull: true,
	});
};

export const down: Migration = async ({ context: sequelize }) => {
	// deletedAtカラムを削除する
	await sequelize.getQueryInterface().removeColumn(TABLE_NAME, COLUMN_NAME);
};
