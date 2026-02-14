import type { Migration } from "@/migrator/umzug";
import { DataTypes } from "sequelize";

const TABLE_NAME = "PredefinedRolesCommands";

export const up: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().createTable(TABLE_NAME, {
		predefinedRolesId: {
			allowNull: false,
			primaryKey: true,
			type: DataTypes.INTEGER,
		},
		commandCategoryType: {
			allowNull: false,
			primaryKey: true,
			type: DataTypes.INTEGER,
		},
		commandType: {
			allowNull: false,
			primaryKey: true,
			type: DataTypes.INTEGER,
		},
		isAllow: {
			allowNull: false,
			type: DataTypes.BOOLEAN,
			defaultValue: true,
		},
		createdAt: {
			allowNull: false,
			type: DataTypes.DATE,
		},
		updatedAt: {
			allowNull: false,
			type: DataTypes.DATE,
		},
	});
};
export const down: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().dropTable(TABLE_NAME);
};
