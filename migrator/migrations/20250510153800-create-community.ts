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
		communityType: {
			allowNull: false,
			type: DataTypes.INTEGER,
		},
		clientCommunityId: {
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
        fields: ["communityType", "clientCommunityId"],
        type: "unique",
        name: "unique_community_type_and_client_community_id", // 制約名つけようねっ
    });
};
export const down: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().dropTable(TABLE_NAME);
};
