import type { Migration } from "@/migrator/umzug";
import { DataTypes } from "sequelize";

export const up: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().createTable("UserItems", {
		id: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER,
		},
		userId: {
			allowNull: false,
			type: DataTypes.BIGINT,
		},
		itemId: {
			allowNull: false,
			type: DataTypes.INTEGER,
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
	await sequelize.getQueryInterface().dropTable("UserItems");
};
