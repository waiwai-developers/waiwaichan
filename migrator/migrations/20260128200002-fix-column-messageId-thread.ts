import type { Migration } from "@/migrator/umzug";
import { GetEnvAppConfig } from "@/src/entities/config/AppConfig";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { DataTypes, QueryTypes } from "sequelize";

const THREADS_TABLE_NAME = "Threads";
const MESSAGES_TABLE_NAME = "Messages";
const COMMUNITIES_TABLE_NAME = "Communities";
const CHANNELS_TABLE_NAME = "Channels";
const USERS_TABLE_NAME = "Users";
const COLUMN_NAME_CLIENT_ID = "clientId";
const COLUMN_NAME_MESSAGE_ID = "messageId";

// Discord categoryType
const CATEGORY_TYPE_DISCORD = 0;
// batchStatus: Yet
const BATCH_STATUS_YET = 0;

interface ThreadRecord {
	communityId: number;
	messageId: string;
}

interface CommunityRecord {
	id: number;
	clientId: string;
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

	// Step 1: ThreadsテーブルのDiscordClientのmessageIdを全て取得しdiscordClientにアクセスし
	// CommunityテーブルやUsersテーブルやChannelsテーブルのidを取得しMessageテーブルのレコードとして発行する
	console.log(
		"Step 1: Fetching Thread records and creating Message records via Discord API...",
	);

	// Get all Thread records
	const threads = await sequelize.query<ThreadRecord>(
		`SELECT communityId, messageId FROM ${THREADS_TABLE_NAME}`,
		{ type: QueryTypes.SELECT },
	);

	console.log(`Found ${threads.length} Thread records`);

	if (threads.length > 0) {
		// Get all Communities for lookup
		const communities = await sequelize.query<CommunityRecord>(
			`SELECT id, clientId FROM ${COMMUNITIES_TABLE_NAME}`,
			{ type: QueryTypes.SELECT },
		);
		const communityByClientId = new Map(
			communities.map((c) => [c.clientId, c.id]),
		);
		const communityById = new Map(communities.map((c) => [c.id, c.clientId]));

		// Get all Channels for lookup
		const channels = await sequelize.query<ChannelRecord>(
			`SELECT id, clientId, communityId FROM ${CHANNELS_TABLE_NAME}`,
			{ type: QueryTypes.SELECT },
		);
		const channelByClientIdAndCommunityId = new Map<string, number>(
			channels.map((c) => [`${c.clientId}_${c.communityId}`, c.id]),
		);

		// Get all Users for lookup
		const users = await sequelize.query<UserRecord>(
			`SELECT id, clientId, communityId FROM ${USERS_TABLE_NAME}`,
			{ type: QueryTypes.SELECT },
		);
		const userByClientIdAndCommunityId = new Map<string, number>(
			users.map((u) => [`${u.clientId}_${u.communityId}`, u.id]),
		);

		// Initialize Discord client
		const appConfig = GetEnvAppConfig();
		const client = new Client({
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.MessageContent,
			],
			partials: [Partials.Message, Partials.Channel],
		});

		try {
			await client.login(appConfig.discord.token);
			console.log("Discord client logged in");

			// Wait for client to be ready
			await new Promise<void>((resolve) => {
				if (client.isReady()) {
					resolve();
				} else {
					client.once("ready", () => resolve());
				}
			});

			const now = new Date();
			const messagesToInsert: Array<{
				categoryType: number;
				clientId: string;
				communityId: number;
				channelId: number;
				userId: number;
				batchStatus: number;
				createdAt: Date;
				updatedAt: Date;
			}> = [];

			for (const thread of threads) {
				try {
					// Get community's Discord guild ID
					const guildClientId = communityById.get(thread.communityId);
					if (!guildClientId) {
						console.warn(
							`Community not found for communityId: ${thread.communityId}`,
						);
						continue;
					}

					// Fetch guild from Discord
					const guild = await client.guilds.fetch(guildClientId);
					if (!guild) {
						console.warn(`Guild not found for clientId: ${guildClientId}`);
						continue;
					}

					// Find the message by searching all text channels
					let foundMessage = null;
					const textChannels = guild.channels.cache.filter(
						(c) => c.isTextBased() && !c.isThread(),
					);

					for (const [, channel] of textChannels) {
						try {
							if (!channel.isTextBased()) continue;
							// @ts-ignore - fetch is available on text-based channels
							const message = await channel.messages.fetch(thread.messageId);
							if (message) {
								foundMessage = message;
								break;
							}
						} catch {
							// Message not in this channel, continue searching
						}
					}

					if (!foundMessage) {
						console.warn(
							`Message not found for messageId: ${thread.messageId} in guild: ${guildClientId}`,
						);
						continue;
					}

					// Get channel ID from our database
					const channelKey = `${foundMessage.channelId}_${thread.communityId}`;
					const channelId = channelByClientIdAndCommunityId.get(channelKey);
					if (!channelId) {
						console.warn(
							`Channel not found in database for clientId: ${foundMessage.channelId}, communityId: ${thread.communityId}`,
						);
						continue;
					}

					// Get user ID from our database
					const userKey = `${foundMessage.author.id}_${thread.communityId}`;
					const userId = userByClientIdAndCommunityId.get(userKey);
					if (!userId) {
						console.warn(
							`User not found in database for clientId: ${foundMessage.author.id}, communityId: ${thread.communityId}`,
						);
						continue;
					}

					messagesToInsert.push({
						categoryType: CATEGORY_TYPE_DISCORD,
						clientId: thread.messageId,
						communityId: thread.communityId,
						channelId: channelId,
						userId: userId,
						batchStatus: BATCH_STATUS_YET,
						createdAt: now,
						updatedAt: now,
					});
				} catch (error) {
					console.error(
						`Error processing thread messageId: ${thread.messageId}`,
						error,
					);
				}
			}

			// Bulk insert messages
			if (messagesToInsert.length > 0) {
				const insertValues = messagesToInsert
					.map(
						(m) =>
							`(${m.categoryType}, ${m.clientId}, ${m.communityId}, ${m.channelId}, ${m.userId}, ${m.batchStatus}, '${m.createdAt.toISOString().slice(0, 19).replace("T", " ")}', '${m.updatedAt.toISOString().slice(0, 19).replace("T", " ")}')`,
					)
					.join(", ");

				await sequelize.query(
					`INSERT INTO ${MESSAGES_TABLE_NAME} (categoryType, clientId, communityId, channelId, userId, batchStatus, createdAt, updatedAt) VALUES ${insertValues}`,
				);
				console.log(`Inserted ${messagesToInsert.length} Message records`);
			}

			client.destroy();
			console.log("Discord client disconnected");
		} catch (error) {
			client.destroy();
			throw error;
		}
	}

	// Step 2: ThreadsテーブルのmessageIdをclientIdに命名を変更する
	// Threadsテーブルはidカラムがauto incrementでprimary keyなので、PRIMARY KEY制約の操作は不要
	console.log("Step 2: Renaming messageId to clientId in Threads table...");

	await queryInterface.renameColumn(
		THREADS_TABLE_NAME,
		COLUMN_NAME_MESSAGE_ID,
		COLUMN_NAME_CLIENT_ID,
	);

	// Step 3: Threadsテーブルに新たにmessageIdのカラムをIntegerで発行する
	console.log(
		"Step 3: Adding new messageId column (INTEGER) to Threads table...",
	);
	await queryInterface.addColumn(THREADS_TABLE_NAME, COLUMN_NAME_MESSAGE_ID, {
		type: DataTypes.INTEGER,
		allowNull: true,
	});

	// Step 4: ThreadsテーブルのclientIdと一致するMessageテーブルのidを取得しThreadsテーブルのmessageIdを埋める
	console.log(
		"Step 4: Updating Threads.messageId with Messages.id based on clientId...",
	);
	await sequelize.query(`
		UPDATE ${THREADS_TABLE_NAME} AS th
		INNER JOIN ${MESSAGES_TABLE_NAME} AS m ON th.${COLUMN_NAME_CLIENT_ID} = m.clientId AND th.communityId = m.communityId
		SET th.${COLUMN_NAME_MESSAGE_ID} = m.id
	`);

	// Step 5: ThreadsテーブルのmessageIdにnot null 制約を追加する
	console.log("Step 5: Adding NOT NULL constraint to Threads.messageId...");
	await queryInterface.changeColumn(
		THREADS_TABLE_NAME,
		COLUMN_NAME_MESSAGE_ID,
		{
			type: DataTypes.INTEGER,
			allowNull: false,
		},
	);

	console.log("Migration completed successfully!");
};

export const down: Migration = async ({ context: sequelize }) => {
	const queryInterface = sequelize.getQueryInterface();

	// Step 5 reverse: Remove NOT NULL constraint (revert to nullable)
	console.log("Reverting Step 5: Making messageId nullable...");
	await queryInterface.changeColumn(
		THREADS_TABLE_NAME,
		COLUMN_NAME_MESSAGE_ID,
		{
			type: DataTypes.INTEGER,
			allowNull: true,
		},
	);

	// Step 3 reverse: Remove the new messageId column
	console.log("Reverting Step 3: Removing messageId column...");
	await queryInterface.removeColumn(
		THREADS_TABLE_NAME,
		COLUMN_NAME_MESSAGE_ID,
	);

	// Step 2 reverse: Rename clientId back to messageId
	console.log("Reverting Step 2: Renaming clientId back to messageId...");
	await queryInterface.renameColumn(
		THREADS_TABLE_NAME,
		COLUMN_NAME_CLIENT_ID,
		COLUMN_NAME_MESSAGE_ID,
	);

	// Step 1 reverse: Delete the created Message records
	// Note: This is a destructive operation. The Messages created during up migration
	// cannot be precisely identified, so we leave them as is.
	console.log(
		"Note: Message records created during migration are not removed to prevent data loss.",
	);

	console.log("Migration rollback completed!");
};
