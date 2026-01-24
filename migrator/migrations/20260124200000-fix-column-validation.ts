import type { Migration } from "@/migrator/umzug";
import { DataTypes } from "sequelize";

export const up: Migration = async ({ context: sequelize }) => {
	const queryInterface = sequelize.getQueryInterface();

	// UserItems - candyId → NOT NULL
	await queryInterface.changeColumn("UserItems", "candyId", {
		type: DataTypes.INTEGER,
		allowNull: false,
	});

    // UserItems - communityId → NOT NULL
	await queryInterface.changeColumn("UserItems", "communityId", {
		type: DataTypes.INTEGER,
		allowNull: false,
	});

	// Threads - communityId → NOT NULL
	await queryInterface.changeColumn("Threads", "communityId", {
		type: DataTypes.INTEGER,
		allowNull: false,
	});

	// Stickies - communityId → NOT NULL
	await queryInterface.changeColumn("Stickies", "communityId", {
		type: DataTypes.INTEGER,
		allowNull: false,
	});

	// Stickies - channelId → NOT NULL
	await queryInterface.changeColumn("Stickies", "channelId", {
		type: DataTypes.INTEGER,
		allowNull: false,
	});

	// Stickies - userId → Integer NOT NULL
	await queryInterface.changeColumn("Stickies", "userId", {
		type: DataTypes.INTEGER,
		allowNull: false,
	});

	// RoomNotificationChannels - communityId → NOT NULL
	await queryInterface.changeColumn("RoomNotificationChannels", "communityId", {
		type: DataTypes.INTEGER,
		allowNull: false,
	});

	// RoomNotificationChannels - channelId → NOT NULL
	await queryInterface.changeColumn("RoomNotificationChannels", "channelId", {
		type: DataTypes.INTEGER,
		allowNull: false,
	});

	// RoomChannels - communityId → NOT NULL
	await queryInterface.changeColumn("RoomChannels", "communityId", {
		type: DataTypes.INTEGER,
		allowNull: false,
	});

	// RoomChannels - channelId → NOT NULL
	await queryInterface.changeColumn("RoomChannels", "channelId", {
		type: DataTypes.INTEGER,
		allowNull: false,
	});

	// RoomAddChannels - communityId → NOT NULL
	await queryInterface.changeColumn("RoomAddChannels", "communityId", {
		type: DataTypes.INTEGER,
		allowNull: false,
	});

	// RoomAddChannels - channelId → NOT NULL
	await queryInterface.changeColumn("RoomAddChannels", "channelId", {
		type: DataTypes.INTEGER,
		allowNull: false,
	});

	// Reminders - communityId → NOT NULL
	await queryInterface.changeColumn("Reminders", "communityId", {
		type: DataTypes.INTEGER,
		allowNull: false,
	});

	// Reminders - channelId → NOT NULL
	await queryInterface.changeColumn("Reminders", "channelId", {
		type: DataTypes.INTEGER,
		allowNull: false,
	});

	// Reminders - userId → Integer (nullable)
	await queryInterface.changeColumn("Reminders", "userId", {
		type: DataTypes.INTEGER,
		allowNull: true,
	});

	// Crowns - communityId → デフォルトの削除
	await queryInterface.changeColumn("Crowns", "communityId", {
		type: DataTypes.INTEGER,
		allowNull: false,
	});

	// Candies - userId → Integer (nullable)
	await queryInterface.changeColumn("Candies", "userId", {
		type: DataTypes.INTEGER,
		allowNull: true,
	});

	// Candies - communityId → NOT NULL
	await queryInterface.changeColumn("Candies", "communityId", {
		type: DataTypes.INTEGER,
		allowNull: false,
	});
};

export const down: Migration = async ({ context: sequelize }) => {
	const queryInterface = sequelize.getQueryInterface();

	// Revert Candies - communityId
	await queryInterface.changeColumn("Candies", "communityId", {
		type: DataTypes.INTEGER,
		allowNull: true,
	});

	// Revert Candies - userId
	await queryInterface.changeColumn("Candies", "userId", {
		type: DataTypes.BIGINT,
		allowNull: true,
	});

	// Revert Crowns - communityId (add default back)
	await queryInterface.changeColumn("Crowns", "communityId", {
		type: DataTypes.INTEGER,
		allowNull: false,
		defaultValue: 1,
	});

	// Revert Reminders - userId
	await queryInterface.changeColumn("Reminders", "userId", {
		type: DataTypes.BIGINT,
		allowNull: true,
	});

	// Revert Reminders - channelId
	await queryInterface.changeColumn("Reminders", "channelId", {
		type: DataTypes.INTEGER,
		allowNull: true,
	});

	// Revert Reminders - communityId
	await queryInterface.changeColumn("Reminders", "communityId", {
		type: DataTypes.INTEGER,
		allowNull: true,
	});

	// Revert RoomAddChannels - channelId
	await queryInterface.changeColumn("RoomAddChannels", "channelId", {
		type: DataTypes.INTEGER,
		allowNull: true,
	});

	// Revert RoomAddChannels - communityId
	await queryInterface.changeColumn("RoomAddChannels", "communityId", {
		type: DataTypes.INTEGER,
		allowNull: true,
	});

	// Revert RoomChannels - channelId
	await queryInterface.changeColumn("RoomChannels", "channelId", {
		type: DataTypes.INTEGER,
		allowNull: true,
	});

	// Revert RoomChannels - communityId
	await queryInterface.changeColumn("RoomChannels", "communityId", {
		type: DataTypes.INTEGER,
		allowNull: true,
	});

	// Revert RoomNotificationChannels - channelId
	await queryInterface.changeColumn("RoomNotificationChannels", "channelId", {
		type: DataTypes.INTEGER,
		allowNull: true,
	});

	// Revert RoomNotificationChannels - communityId
	await queryInterface.changeColumn("RoomNotificationChannels", "communityId", {
		type: DataTypes.INTEGER,
		allowNull: true,
	});

	// Revert Stickies - userId
	await queryInterface.changeColumn("Stickies", "userId", {
		type: DataTypes.BIGINT,
		allowNull: true,
	});

	// Revert Stickies - channelId
	await queryInterface.changeColumn("Stickies", "channelId", {
		type: DataTypes.INTEGER,
		allowNull: true,
	});

	// Revert Stickies - communityId
	await queryInterface.changeColumn("Stickies", "communityId", {
		type: DataTypes.INTEGER,
		allowNull: true,
	});

	// Revert Threads - communityId
	await queryInterface.changeColumn("Threads", "communityId", {
		type: DataTypes.INTEGER,
		allowNull: true,
	});

	await queryInterface.changeColumn("UserItems", "communityId", {
		type: DataTypes.INTEGER,
		allowNull: true,
	});

	// Revert UserItems - candyId
	await queryInterface.changeColumn("UserItems", "candyId", {
		type: DataTypes.INTEGER,
		allowNull: true,
	});
};
