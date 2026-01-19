import type { Datafix } from "@/migrator/umzug";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { CommunityBatchStatus } from "@/src/entities/vo/CommunityBatchStatus";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { DatafixCommunityModel } from "./models/DatafixCommunityModel";

export const up: Datafix = async () => {
	await DatafixCommunityModel.create({
		id: 1,
		categoryType: CommunityCategoryType.Discord.getValue(),
		clientId: AppConfig.discord.clientId,
		batchStatus: CommunityBatchStatus.Yet.getValue(),
	});
};

export const down: Datafix = async () => {
	await DatafixCommunityModel.destroy();
};
