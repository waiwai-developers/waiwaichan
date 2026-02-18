import type { Migration } from "@/migrator/umzug";
import { DataTypes } from "sequelize";

const TABLE_NAME = "CustomRolesCommands";

export const up: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().createTable(TABLE_NAME, {
		id: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER,
		},
		communityId: {
			allowNull: false,
			type: DataTypes.INTEGER,
		},
		customRoleId: {
			allowNull: false,
			type: DataTypes.INTEGER,
		},
		commandCategoryType: {
			allowNull: false,
			type: DataTypes.INTEGER,
		},
		commandType: {
			allowNull: false,
			type: DataTypes.INTEGER,
		},
		isAllow: {
			allowNull: false,
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
		createdAt: {
			allowNull: false,
			type: DataTypes.DATE,
		},
		updatedAt: {
			allowNull: false,
			type: DataTypes.DATE,
		},
		deletedAt: {
			type: DataTypes.DATE,
		},
	});
};
export const down: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().dropTable(TABLE_NAME);
};
