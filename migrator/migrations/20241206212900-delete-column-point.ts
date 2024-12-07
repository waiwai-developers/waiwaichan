import type { Migration } from "@/migrator/umzug";

const TABLE_NAME = "Points";
const COLUMN_NAME = "status";

export const up: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().removeColumn(TABLE_NAME, COLUMN_NAME);
};
