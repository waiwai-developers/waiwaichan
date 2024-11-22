import type { Migration } from "@/migrator/umzug";
import { DataTypes } from "sequelize";

export const up: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().createTable("Points", {
		id: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER,
		},
		receiveUserId: {
			allowNull: false,
			type: DataTypes.BIGINT,
		},
		giveUserId: {
			allowNull: false,
			type: DataTypes.BIGINT,
		},
		messageId: {
			allowNull: false,
			type: DataTypes.BIGINT,
		},
		status: {
			allowNull: false,
			type: DataTypes.BOOLEAN,
		},
		expiredAt: {
			allowNull: false,
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
	await sequelize.getQueryInterface().dropTable("Points");
};
