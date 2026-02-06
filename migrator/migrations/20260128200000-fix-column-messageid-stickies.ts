import type { Migration } from "@/migrator/umzug";
import { GetEnvAppConfig } from "@/src/entities/config/AppConfig";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { DataTypes, QueryTypes } from "sequelize";

const STICKIES_TABLE_NAME = "Stickies";
const MESSAGES_TABLE_NAME = "Messages";
const CHANNELS_TABLE_NAME = "Channels";
const USERS_TABLE_NAME = "Users";
const COLUMN_NAME_CLIENT_ID = "clientId";
const COLUMN_NAME_MESSAGE_ID = "messageId";

// Discord categoryType
const CATEGORY_TYPE_DISCORD = 0;
// batchStatus: Yet
const BATCH_STATUS_YET = 0;

interface StickyRecord {
	communityId: number;
	messageId: string;
}

interface ChannelRecord {
	id: number;
	clientId: string;
	communityId: number;
}

interface UserRecord {
	id: number;
	clientId: string;
	communityId: number;
}

export const up: Migration = async ({ context: sequelize }) => {
	const queryInterface = sequelize.getQueryInterface();

	// Step 1: StickiesテーブルのDiscordClientのmessageIdを全て取得する
	const stickyRecords = await sequelize.query<StickyRecord>(
		`SELECT communityId, messageId FROM ${STICKIES_TABLE_NAME}`,
		{ type: QueryTypes.SELECT },
	);

	if (stickyRecords.length === 0) {
		console.log("No sticky records found, skipping Discord client access");
	} else {
		// Step 2: discordClientにアクセスしUsersのclientIdとChannelsのclientIdを取得する
		const appConfig = GetEnvAppConfig();
		const client = new Client({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent,
			],
			partials: [Partials.Message, Partials.Channel],
		});

		await client.login(appConfig.discord.token);

		// Wait for client to be ready
		await new Promise<void>((resolve) => {
			client.once("ready", () => {
				console.log("Discord client is ready");
				resolve();
			});
		});

		for (const stickyRecord of stickyRecords) {
			try {
				const discordMessageId = stickyRecord.messageId;

				// Find the Discord message
				let message: any = null;
				let channelClientId: string | null = null;
				let userClientId: string | null = null;

				// Search through all guilds and channels to find the message
				for (const guild of client.guilds.cache.values()) {
					for (const channel of guild.channels.cache.values()) {
						if (channel.isTextBased()) {
							try {
								// @ts-ignore - TextBasedChannel has messages
								message = await channel.messages.fetch(discordMessageId);
								if (message) {
									channelClientId = channel.id;
									userClientId = message.author.id;
									break;
								}
							} catch (error) {}
						}
					}
					if (message) break;
				}

				if (!message || !channelClientId || !userClientId) {
					console.log(
						`Message ${discordMessageId} not found in Discord, deleting sticky record`,
					);
					// Discord上で既に削除されているデータのStickyレコードを削除する
					await sequelize.query(
						`DELETE FROM ${STICKIES_TABLE_NAME} WHERE messageId = :messageId AND communityId = :communityId`,
						{
							replacements: {
								messageId: discordMessageId,
								communityId: stickyRecord.communityId,
							},
							type: QueryTypes.DELETE,
						},
					);
					continue;
				}

				// Step 3: Communitiesのid: 1 Usersのid: clientIdに対応するid Channelsのid: clientIdに対応するidでMessagesのレコードを発行する
				// ただしDeletedAtがnullな物があれば優先的に紐づける

				// Get user id from Users table
				const users = await sequelize.query<UserRecord>(
					`SELECT id FROM ${USERS_TABLE_NAME} WHERE clientId = :userClientId AND communityId = :communityId LIMIT 1`,
					{
						replacements: {
							userClientId,
							communityId: stickyRecord.communityId,
						},
						type: QueryTypes.SELECT,
					},
				);

				if (users.length === 0) {
					console.log(`User with clientId ${userClientId} not found, skipping`);
					continue;
				}

				const userId = users[0].id;

				// Get channel id from Channels table
				const channels = await sequelize.query<ChannelRecord>(
					`SELECT id FROM ${CHANNELS_TABLE_NAME} WHERE clientId = :channelClientId AND communityId = :communityId LIMIT 1`,
					{
						replacements: {
							channelClientId,
							communityId: stickyRecord.communityId,
						},
						type: QueryTypes.SELECT,
					},
				);

				if (channels.length === 0) {
					console.log(
						`Channel with clientId ${channelClientId} not found, skipping`,
					);
					continue;
				}

				const channelId = channels[0].id;

				// Check if message already exists (prefer non-deleted)
				const existingMessages = await sequelize.query<{
					id: number;
					deletedAt: Date | null;
				}>(
					`SELECT id, deletedAt FROM ${MESSAGES_TABLE_NAME}
					WHERE clientId = :clientId
					AND communityId = :communityId
					AND channelId = :channelId
					AND userId = :userId
					ORDER BY deletedAt IS NULL DESC, id ASC
					LIMIT 1`,
					{
						replacements: {
							clientId: discordMessageId,
							communityId: stickyRecord.communityId,
							channelId,
							userId,
						},
						type: QueryTypes.SELECT,
					},
				);

				if (existingMessages.length > 0) {
					console.log(
						`Message record already exists for Discord message ${discordMessageId}, using existing id: ${existingMessages[0].id}`,
					);
				} else {
					// Create new message record
					await sequelize.query(
						`INSERT INTO ${MESSAGES_TABLE_NAME}
						(categoryType, clientId, communityId, channelId, userId, batchStatus, createdAt, updatedAt)
						VALUES (:categoryType, :clientId, :communityId, :channelId, :userId, :batchStatus, NOW(), NOW())`,
						{
							replacements: {
								categoryType: CATEGORY_TYPE_DISCORD,
								clientId: discordMessageId,
								communityId: stickyRecord.communityId,
								channelId,
								userId,
								batchStatus: BATCH_STATUS_YET,
							},
							type: QueryTypes.INSERT,
						},
					);
					console.log(
						`Created message record for Discord message ${discordMessageId}`,
					);
				}
			} catch (error) {
				console.error("Error processing sticky record:", error);
			}
		}

		await client.destroy();
	}

	// Step 4: StickiesテーブルのmessageIdをclientIdに命名を変更する
	await queryInterface.renameColumn(
		STICKIES_TABLE_NAME,
		COLUMN_NAME_MESSAGE_ID,
		COLUMN_NAME_CLIENT_ID,
	);
	console.log(
		`Renamed ${COLUMN_NAME_MESSAGE_ID} to ${COLUMN_NAME_CLIENT_ID} in ${STICKIES_TABLE_NAME} table`,
	);

	// Step 5: Stickiesテーブルに新たにmessageIdのカラムをIntegerで追加する
	await queryInterface.addColumn(STICKIES_TABLE_NAME, COLUMN_NAME_MESSAGE_ID, {
		type: DataTypes.INTEGER,
		allowNull: true,
	});
	console.log(
		`Added new ${COLUMN_NAME_MESSAGE_ID} column to ${STICKIES_TABLE_NAME} table`,
	);

	// Step 6: StickiesテーブルのclientIdと一致するMessageテーブルのidを取得しStickiesテーブルのmessageIdを埋める
	await sequelize.query(
		`UPDATE ${STICKIES_TABLE_NAME} s
		INNER JOIN ${MESSAGES_TABLE_NAME} m ON s.${COLUMN_NAME_CLIENT_ID} = m.clientId AND s.communityId = m.communityId
		SET s.${COLUMN_NAME_MESSAGE_ID} = m.id`,
		{ type: QueryTypes.UPDATE },
	);
	console.log(
		`Updated ${COLUMN_NAME_MESSAGE_ID} in ${STICKIES_TABLE_NAME} table with Messages.id`,
	);

	// Step 7: Make messageId NOT NULL now that it's populated
	await queryInterface.changeColumn(
		STICKIES_TABLE_NAME,
		COLUMN_NAME_MESSAGE_ID,
		{
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	);
	console.log(
		`Changed ${COLUMN_NAME_MESSAGE_ID} to NOT NULL in ${STICKIES_TABLE_NAME} table`,
	);
};

export const down: Migration = async ({ context: sequelize }) => {
	const queryInterface = sequelize.getQueryInterface();
	// Reverse Step 6: Clear messageId values (no specific action needed as we're about to remove the column)

	// Reverse Step 5: Remove the new messageId column
	await queryInterface.removeColumn(
		STICKIES_TABLE_NAME,
		COLUMN_NAME_MESSAGE_ID,
	);

	// Reverse Step 4: Rename clientId back to messageId
	await queryInterface.renameColumn(
		STICKIES_TABLE_NAME,
		COLUMN_NAME_CLIENT_ID,
		COLUMN_NAME_MESSAGE_ID,
	);

	// Note: We don't reverse Steps 1-3 (message record creation) as those are data operations
	// and the message records may be in use by other parts of the system
};
