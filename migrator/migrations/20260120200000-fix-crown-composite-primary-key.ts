import type { Migration } from "@/migrator/umzug";
import { DataTypes } from "sequelize";

const TABLE_NAME = "Crowns";

export const up: Migration = async ({ context: sequelize }) => {
	const queryInterface = sequelize.getQueryInterface();

	// Check current table structure and fix if needed
	const tableDescription = await queryInterface.describeTable(TABLE_NAME);

	// If communityId doesn't exist or allows null, we need to fix it
	if (!tableDescription.communityId || tableDescription.communityId.allowNull) {
		// First, handle existing data - set default communityId to 0 for any null values
		if (tableDescription.communityId) {
			await sequelize.query(
				`UPDATE ${TABLE_NAME} SET communityId = 0 WHERE communityId IS NULL`,
			);
		}

		// Remove current primary key
		try {
			await queryInterface.removeConstraint(TABLE_NAME, "PRIMARY");
		} catch {
			// Primary key might not exist or have a different name
		}

		// If communityId doesn't exist, add it
		if (!tableDescription.communityId) {
			await queryInterface.addColumn(TABLE_NAME, "communityId", {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 1,
			});
		} else {
			// Change communityId to not allow null
			await queryInterface.changeColumn(TABLE_NAME, "communityId", {
				type: DataTypes.INTEGER,
				allowNull: false,
				defaultValue: 1,
			});
		}

		// Add composite primary key
		await queryInterface.addConstraint(TABLE_NAME, {
			fields: ["communityId", "messageId"],
			type: "primary key",
			name: "PRIMARY",
		});
	}
};

export const down: Migration = async ({ context: sequelize }) => {
	// This is a fix migration, down is intentionally empty
	// as we don't want to revert to a broken state
};
