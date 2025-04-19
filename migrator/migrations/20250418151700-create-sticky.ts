import type { Migration } from "@/migrator/umzug";
import { DataTypes } from "sequelize";

const TABLE_NAME = "Stickies";

export const up: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().createTable(TABLE_NAME, {
		id: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER,
		},
		guildId: {
			allowNull: false,
			type: DataTypes.BIGINT,
		},
		channelId: {
			allowNull: false,
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