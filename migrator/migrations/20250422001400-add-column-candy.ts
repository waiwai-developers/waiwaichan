import type { Migration } from "@/migrator/umzug";
import { DataTypes } from "sequelize";

const TABLE_NAME = "Candies";
const COLUMN_NAME = "guildId";

export const up: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().changeColumn(TABLE_NAME, COLUMN_NAME, {
		type: DataTypes.BIGINT,
		allowNull: false
	});
};
export const down: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().changeColumn(TABLE_NAME, COLUMN_NAME, {
		type: DataTypes.BIGINT,
		allowNull: true
	});
};
