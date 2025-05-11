import type { Migration } from "@/migrator/umzug";
import { DataTypes } from "sequelize";

const TABLE_NAME = "Communities";

export const up: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().createTable(TABLE_NAME, {
		id: {
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER,
		},
		categoryType: {
			allowNull: false,
			type: DataTypes.INTEGER,
		},
		clientId: {
			allowNull: false,
			type: DataTypes.STRING,
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
	})

    await sequelize.getQueryInterface().addConstraint(TABLE_NAME, {
        fields: ["categoryType", "clientId"],
        type: "unique",
        name: "unique_category_type_and_client_id", // 制約名つけようねっ
    });
};
export const down: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().dropTable(TABLE_NAME);
};
