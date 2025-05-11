import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { ActionDto } from "@/src/entities/dto/ActionDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { Guild } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class ActionAddBotHandler implements DiscordEventHandler<Guild> {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	@inject(LogicTypes.CommunityLogic)
	private readonly CommunityLogic!: ICommunityLogic;

	async handle(guild: Guild): Promise<void> {
		try {
			this.logger.info(
				`ActionAddBotHandler: Bot was added to guild ${guild.id}`,
			);
			await this.CommunityLogic.create(
				new ActionDto(
					CommunityCategoryType.Discord,
					new CommunityClientId(guild.id),
				),
			);
		} catch (error) {
			this.logger.error(`ActionAddBotHandler error: ${error}`);
		}
	}
}
