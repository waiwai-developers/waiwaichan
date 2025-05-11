import type { Migration } from "@/migrator/umzug";
import { DataTypes } from "sequelize";

const TABLE_NAME = "PersonalityContexts";

export const up: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().createTable(TABLE_NAME, {
		personalityId: {
			allowNull: false,
			primaryKey: true,
			type: DataTypes.INTEGER,
		},
		contextId: {
			allowNull: false,
			primaryKey: true,
			type: DataTypes.INTEGER,
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
