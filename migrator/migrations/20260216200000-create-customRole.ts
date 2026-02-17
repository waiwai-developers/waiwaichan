import type { Migration } from "@/migrator/umzug";
import { DataTypes } from "sequelize";

const TABLE_NAME = "CustomRoles";

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
		name: {
			allowNull: false,
			type: DataTypes.STRING,
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
