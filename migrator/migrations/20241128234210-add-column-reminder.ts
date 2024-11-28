import type { Migration } from "@/migrator/umzug";
import { DataTypes } from "sequelize";

const TABLE_NAME = "Reminders";
const COLUMN_NAME = "receiveUserName";

export const up: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().addColumn(TABLE_NAME, COLUMN_NAME, {
		allowNull: false,
		type: DataTypes.STRING,
	});
};
export const down: Migration = async ({ context: sequelize }) => {
	await sequelize.removeColumn(TABLE_NAME, COLUMN_NAME)
};
