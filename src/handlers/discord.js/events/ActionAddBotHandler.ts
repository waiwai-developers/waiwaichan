import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import { inject, injectable } from "inversify";
import type { Guild } from "discord.js";

@injectable()
export class ActionAddBotHandler
	implements DiscordEventHandler<Guild>
{
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	async handle(guild: Guild): Promise<void> {
		try {
			this.logger.info(`ActionAddBotHandler: Bot was added to guild ${guild.id}`);
		} catch (error) {
			this.logger.error(`ActionAddBotHandler error: ${error}`);
		}
	}
}
