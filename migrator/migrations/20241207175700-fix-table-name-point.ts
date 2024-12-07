import type { Migration } from "@/migrator/umzug";

const BEFORE_TABLE_NAME = "Points";
const AFTER_TABLE_NAME = "Candies";

export const up: Migration = async ({ context: sequelize }) => {
	await sequelize
		.getQueryInterface()
		.renameTable(BEFORE_TABLE_NAME, AFTER_TABLE_NAME);
};
export const down: Migration = async ({ context: sequelize }) => {
	await sequelize
		.getQueryInterface()
		.renameTable(AFTER_TABLE_NAME, BEFORE_TABLE_NAME);
};
