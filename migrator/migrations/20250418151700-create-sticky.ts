import type { Migration } from "@/migrator/umzug";
import { DataTypes } from "sequelize";

const TABLE_NAME = "Stickies";

export const up: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().createTable(TABLE_NAME, {
		guildId: {
			allowNull: false,
			primaryKey: true,
			type: DataTypes.BIGINT,
		},
		channelId: {
			allowNull: false,
			primaryKey: true,
			type: DataTypes.BIGINT,
		},
		userId: {
			allowNull: false,
			primaryKey: true,
			type: DataTypes.BIGINT,
		},
		messageId: {
			allowNull: false,
			type: DataTypes.BIGINT,
		},
		message: {
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
	});
};
export const down: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().dropTable(TABLE_NAME);
};