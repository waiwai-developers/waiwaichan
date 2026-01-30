import type { Migration } from "@/migrator/umzug";

const TABLE_NAME = "Crowns";
const COLUMN_NAME = "clientId";

export const up: Migration = async ({ context: sequelize }) => {
	const queryInterface = sequelize.getQueryInterface();

	// Check if clientId column exists before trying to remove it
	const tableDescription = await queryInterface.describeTable(TABLE_NAME);

	if (tableDescription[COLUMN_NAME]) {
		// Step 1: Drop the old PRIMARY KEY (communityId, clientId)
		await sequelize.query(`ALTER TABLE ${TABLE_NAME} DROP PRIMARY KEY`);
		console.log(`Dropped old PRIMARY KEY from ${TABLE_NAME} table`);

		// Step 2: Add new PRIMARY KEY (communityId, messageId)
		await sequelize.query(
			`ALTER TABLE ${TABLE_NAME} ADD PRIMARY KEY (communityId, messageId)`,
		);
		console.log(
			`Added new PRIMARY KEY (communityId, messageId) to ${TABLE_NAME} table`,
		);

		// Step 3: Remove the clientId column from Crowns table
		await queryInterface.removeColumn(TABLE_NAME, COLUMN_NAME);
		console.log(`Removed ${COLUMN_NAME} column from ${TABLE_NAME} table`);
	} else {
		console.log(
			`${COLUMN_NAME} column does not exist in ${TABLE_NAME} table, skipping removal`,
		);
	}
};

export const down: Migration = async ({ context: sequelize }) => {
	// This is a cleanup migration, down is intentionally empty
	// as we don't want to re-add the clientId column
};
