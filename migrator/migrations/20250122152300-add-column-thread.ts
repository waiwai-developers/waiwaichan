import type { Migration } from "@/migrator/umzug";
import { DataTypes } from "sequelize";

const TABLE_NAME = "Threads";
const COLUMN_NAME = "metadata";

export const up: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().addColumn(TABLE_NAME, COLUMN_NAME, {
		type: DataTypes.JSON,
	});
};
export const down: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().removeColumn(TABLE_NAME, COLUMN_NAME);
};
