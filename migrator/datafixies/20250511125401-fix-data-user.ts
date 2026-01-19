import type { Datafix } from "@/migrator/umzug";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { UserBatchStatus } from "@/src/entities/vo/UserBatchStatus";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { UserType } from "@/src/entities/vo/UserType";
import { Client, GatewayIntentBits } from "discord.js";
import { DatafixCommunityModel } from "./models/DatafixCommunityModel";
import { DatafixUserModel } from "./models/DatafixUserModel";

export const up: Datafix = async () => {
	if (process.env.CI === "true" || process.env.NODE_ENV === "testing") {
		console.log("skip discord user datafix in CI/testing environment");
		return;
	}

	const client = new Client({
		intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
	});
	await client.login(AppConfig.discord.token);

	try {
		const communities = await DatafixCommunityModel.findAll();
		for (const community of communities) {
			try {
				console.log(`processing community guild: ${community.clientId}`);
				const guild = await client.guilds.fetch(community.clientId);
				const members = await guild.members.fetch();

				await DatafixUserModel.bulkCreate(
					members.map((m) => ({
						categoryType: UserCategoryType.Discord.getValue(),
						clientId: BigInt(m.id),
						userType: m.user.bot
							? UserType.bot.getValue()
							: UserType.user.getValue(),
						communityId: community.id,
						batchStatus: UserBatchStatus.Yet.getValue(),
					})),
				);
				console.log(
					`successfully created ${members.size} users for community guildId: ${community.clientId}`,
				);
			} catch (error: unknown) {
				const message = error instanceof Error ? error.message : String(error);
				console.error(
					`error processing community guildId: ${community.clientId}: ${message}`,
				);
			}
		}
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		console.error(`migration failed: ${message}`);
		throw error;
	}
};

export const down: Datafix = async () => {
	await DatafixUserModel.destroy({
		where: {},
		truncate: true,
	});
};
