import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import type { Client } from "discord.js";
import { inject, injectable } from "inversify";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";

@injectable()
export class ReadyStateRouter implements DiscordEventRouter {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;
	register(client: Client): void {
		client.on("ready", async (c: Client) => {
			if (c.isReady()) {
				this.logger.info(`login: ${c.user.tag}`);
			}
		});
	}
}
