import type { Datafix } from "@/migrator/umzug";
import { DatafixUserModel } from "./models/DatafixUserModel";
import { DatafixCommunityModel } from "./models/DatafixCommunityModel";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { UserBatchStatus } from "@/src/entities/vo/UserBatchStatus";
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ],
});
client.login(AppConfig.discord.token);

export const up: Datafix = async () => {
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
						communityId: community.id,
						batchStatus: UserBatchStatus.Yet.getValue()
					}))
				);
				console.log(`successfully created ${members.size} users for community guildId: ${community.clientId}`);
			} catch (error: any) {
				console.error(`error processing community guildId: ${community.clientId}: ${error.message}`);
				continue;
			}
		}
	} catch (error: any) {
		console.error(`migration failed: ${error.message}`);
		throw error;
	}
};

export const down: Datafix = async () => {
	await DatafixUserModel.destroy({
		where: {},
		truncate: true
	});
};
