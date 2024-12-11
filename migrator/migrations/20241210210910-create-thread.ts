import type { Migration } from "@/migrator/umzug";
import { DataTypes } from "sequelize";

const TABLE_NAME = "Threads";

export const up: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().createTable(TABLE_NAME, {
		guildId: {
			allowNull: false,
			primaryKey: true,
			type: DataTypes.BIGINT,
		},
		messageId: {
			allowNull: false,
			primaryKey: true,
			type: DataTypes.BIGINT,
		},
		categoryType: {
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
