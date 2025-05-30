import type { Migration } from "@/migrator/umzug";
import { DataTypes } from "sequelize";

const TABLE_NAME = "UserItems";
const COLUMN_NAME = "guildId";

export const up: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().addColumn(TABLE_NAME, COLUMN_NAME, {
		type: DataTypes.BIGINT,
	});
};
export const down: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().removeColumn(TABLE_NAME, COLUMN_NAME);
};
