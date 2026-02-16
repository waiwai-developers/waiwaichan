import {
	HandlerTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import type { Client, Role } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class RoleDeleteRouter implements DiscordEventRouter {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;
	@inject(HandlerTypes.RoleDeleteHandler)
	private readonly handler!: DiscordEventHandler<Role>;
	register(client: Client): void {
		client.on("roleDelete", async (role) => {
			try {
				this.logger.info(
					`Role was deleted for guildId: ${role.guild.id} roleId: ${role.id}.`,
				);
				await this.handler.handle(role);
			} catch (e) {
				this.logger.error(`Error: ${e}`);
			}
		});
	}
}
