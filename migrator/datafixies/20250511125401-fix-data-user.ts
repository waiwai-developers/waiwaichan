import type { Datafix } from "@/migrator/umzug";
import { DatafixUserModel } from "./models/DatafixUserModel";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ],
});
client.login(AppConfig.discord.token);

export const up: Datafix = async () => {
	const guildId = AppConfig.discord.guildId;
	const guild = await client.guilds.fetch(guildId);
	const members = await guild.members.fetch();
	await DatafixUserModel.bulkCreate(
		members.map((m) => ({
			categoryType: UserCategoryType.Discord.getValue(),
			clientId: BigInt(m.id),
			communityId: 1
		}))
	);
};

export const down: Datafix = async () => {
	await DatafixUserModel.destroy();
};
