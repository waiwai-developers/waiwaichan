import type { Datafix } from "@/migrator/umzug";
import { DatafixCommunityModel } from "./models/DatafixCommunityModel";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";

export const up: Datafix = async () => {
	await DatafixCommunityModel.create(
        {
			id: 1,
			categoryType: CommunityCategoryType.Discord.getValue(),
			clientId: AppConfig.discord.guildId,
		}
	);
};

export const down: Datafix = async () => {
	await DatafixCommunityModel.destroy();
};
