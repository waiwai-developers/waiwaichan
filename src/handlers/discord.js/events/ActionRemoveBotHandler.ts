import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { Guild } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class ActionRemoveBotHandler implements DiscordEventHandler<Guild> {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	@inject(LogicTypes.CommunityLogic)
	private readonly CommunityLogic!: ICommunityLogic;

	@inject(LogicTypes.UserLogic)
	private readonly UserLogic!: IUserLogic;

	async handle(guild: Guild): Promise<void> {
		try {
			this.logger.info(
				`ActionRemoveBotHandler: Bot was added to guild ${guild.id}`,
			);
			const isDelete = await this.CommunityLogic.delete(
				new CommunityDto(
					CommunityCategoryType.Discord,
					new CommunityClientId(BigInt(guild.id)),
				),
			);
			if (!isDelete) {
				return;
			}

			const communityId = await this.CommunityLogic.getId(
				new CommunityDto(
					CommunityCategoryType.Discord,
					new CommunityClientId(BigInt(guild.id)),
				),
			);
			if (communityId == null) {
				return;
			}

			const isDeletebyCommunityId =
				await this.UserLogic.deletebyCommunityId(communityId);
			if (!isDeletebyCommunityId) {
				return;
			}
		} catch (error) {
			this.logger.error(`ActionRemoveBotHandler error: ${error}`);
		}
	}
}
