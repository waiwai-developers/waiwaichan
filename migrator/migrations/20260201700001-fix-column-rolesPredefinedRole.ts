import type { Migration } from "@/migrator/umzug";
import { DataTypes } from "sequelize";

const TABLE_NAME = "RolesPredefinedRoles";
const COLUMN_NAME = "communityId";

export const up: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().changeColumn(TABLE_NAME, COLUMN_NAME, {
		type: DataTypes.INTEGER,
		allowNull: false,
	});
};

export const down: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().changeColumn(TABLE_NAME, COLUMN_NAME, {
		type: DataTypes.INTEGER,
		allowNull: true,
	});
};
