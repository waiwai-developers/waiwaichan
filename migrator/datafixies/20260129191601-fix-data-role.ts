import type { Datafix } from "@/migrator/umzug";
import { DatafixCommunityModel } from "@/migrator/datafixies/models/DatafixCommunityModel";
import { DatafixRoleModel } from "@/migrator/datafixies/models/DatafixRoleModel";
import { GetEnvAppConfig } from "@/src/entities/config/AppConfig";
import { Client, GatewayIntentBits, Partials } from "discord.js";

const DISCORD_CATEGORY_TYPE = 0;
const ROLE_BATCH_STATUS_NORMAL = 0;

export const up: Datafix = async ({ context: sequelize }) => {
	console.log("Starting fix-data-role datafix...");

	// Discord設定を取得
	const appConfig = GetEnvAppConfig();
	const discordToken = appConfig.discord.token;

	// Discordクライアントを作成
	const client = new Client({
		intents: Object.values(GatewayIntentBits).reduce(
			(all, intent) => (Number.isNaN(intent) ? all : all | Number(intent)),
			0,
		),
		partials: [Partials.Message, Partials.Reaction, Partials.Channel],
	});

	try {
		// Discordにログイン
		console.log("Logging in to Discord...");
		await client.login(discordToken);
		console.log("Successfully logged in to Discord");

		// 少し待機してクライアントが完全に準備されるのを待つ
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// 全てのguildを取得
		const guilds = client.guilds.cache;
		console.log(`Found ${guilds.size} guilds`);

		// ロールデータを収集
		const rolesToInsert: Array<{
			categoryType: number;
			clientId: string;
			communityId: number;
			batchStatus: number;
			createdAt: Date;
			updatedAt: Date;
		}> = [];

		for (const [guildId, guild] of guilds) {
			console.log(`Processing guild: ${guild.name} (${guildId})`);

			// Communitiesテーブルからこのguildに対応するcommunityIdを取得
			const community = await DatafixCommunityModel.findOne({
				where: {
					categoryType: DISCORD_CATEGORY_TYPE,
					clientId: guildId,
				},
			});

			if (!community) {
				console.log(
					`Community not found for guild ${guildId}, skipping this guild`,
				);
				continue;
			}

			const communityId = community.id;
			console.log(`Found communityId: ${communityId} for guild: ${guildId}`);

			// このguildの全てのロールを取得
			const roles = await guild.roles.fetch();
			console.log(`Found ${roles.size} roles in guild ${guild.name}`);

			// 各ロールをRolesテーブル用のデータに変換
			for (const [roleId, role] of roles) {
				rolesToInsert.push({
					categoryType: DISCORD_CATEGORY_TYPE,
					clientId: roleId,
					communityId: communityId,
					batchStatus: ROLE_BATCH_STATUS_NORMAL,
					createdAt: new Date(),
					updatedAt: new Date(),
				});
			}
		}

		console.log(`Total roles to insert: ${rolesToInsert.length}`);

		// Rolesテーブルに一括挿入
		if (rolesToInsert.length > 0) {
			await DatafixRoleModel.bulkCreate(rolesToInsert, {
				ignoreDuplicates: true, // 重複を無視
			});
			console.log(`Successfully inserted ${rolesToInsert.length} roles`);
		} else {
			console.log("No roles to insert");
		}

		// Discordクライアントを破棄
		console.log("Logging out from Discord...");
		await client.destroy();
		console.log("Successfully logged out from Discord");

		console.log("fix-data-role datafix completed successfully");
	} catch (error) {
		console.error("Error during fix-data-role datafix:", error);
		// エラーが発生してもクライアントを破棄する
		try {
			await client.destroy();
		} catch (destroyError) {
			console.error("Error destroying client:", destroyError);
		}
		throw error;
	}
};

export const down: Datafix = async ({ context: sequelize }) => {
	console.log("Reverting fix-data-role datafix...");
	// downでは何もしない（ロールを削除しない）
	console.log("fix-data-role datafix revert completed");
};
