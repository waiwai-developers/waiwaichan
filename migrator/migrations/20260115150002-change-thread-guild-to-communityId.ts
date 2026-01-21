import type { Migration } from "@/migrator/umzug";
import { DataTypes } from "sequelize";

const TABLE_NAME = "Threads";
const COLUMN_NAME_1 = "communityId";
const COLUMN_NAME_2 = "guildId";

export const up: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().addColumn(TABLE_NAME, COLUMN_NAME_1, {
		type: DataTypes.INTEGER,
	});
	await sequelize.getQueryInterface().removeColumn(TABLE_NAME, COLUMN_NAME_2);
};

export const down: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().addColumn(TABLE_NAME, COLUMN_NAME_2, {
		type: DataTypes.BIGINT,
	});
	await sequelize.getQueryInterface().removeColumn(TABLE_NAME, COLUMN_NAME_1);
};
