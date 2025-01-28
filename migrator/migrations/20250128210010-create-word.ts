import type { Migration } from "@/migrator/umzug";
import { DataTypes } from "sequelize";

const TABLE_NAME = "ShiritoriWords";

export const up: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().createTable(TABLE_NAME, {
		userId: {
			allowNull: false,
			type: DataTypes.BIGINT
		},
		guildId: {
			allowNull: false,
			primaryKey: true,
			type: DataTypes.BIGINT
		},
		threadId: {
			allowNull: false,
			type: DataTypes.BIGINT
		},
		messageId: {
			allowNull: false,
			primaryKey: true,
			type: DataTypes.BIGINT
		},
		readingWord: {
			allowNull: false,
			type: DataTypes.STRING
		},
		writingWord: {
			allowNull: false,
			type: DataTypes.STRING
		},
		nextMessageId: {
			type: DataTypes.BIGINT
		},
		createdAt: {
			allowNull: false,
			type: DataTypes.DATE
		},
		updatedAt: {
			allowNull: false,
			type: DataTypes.DATE
		},
		deletedAt: {
			type: DataTypes.DATE
		}
	});
};
export const down: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().dropTable(TABLE_NAME);
};
