import type { Migration } from "@/migrator/umzug";
import { DataTypes } from "sequelize";

const TABLE_NAME = "Users";

export const up: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().createTable(TABLE_NAME, {
		id: {
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER,
		},
		categoryType: {
			allowNull: false,
			type: DataTypes.INTEGER,
		},
		clientId: {
			allowNull: false,
			type: DataTypes.BIGINT,
		},
		userType: {
			allowNull: false,
			type: DataTypes.INTEGER,
		},
		communityId: {
			allowNull: false,
			type: DataTypes.INTEGER,
		},
		batchStatus: {
			allowNull: false,
			type: DataTypes.INTEGER,
		},
		deletedAt: {
			type: DataTypes.DATE,
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
