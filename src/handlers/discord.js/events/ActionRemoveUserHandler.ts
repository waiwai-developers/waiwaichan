import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { GuildMember } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class ActionRemoveUserHandler
	implements DiscordEventHandler<GuildMember>
{
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	@inject(LogicTypes.UserLogic)
	private readonly UserLogic!: IUserLogic;

	async handle(member: GuildMember): Promise<void> {
		try {
			this.logger.info(
				`ActionRemoveUserHandler: User was removed from guild ${member.guild.id}`,
			);
			const isDeletebyClientId = await this.UserLogic.deletebyClientId(
				new UserClientId(BigInt(member.id)),
			);
			if (!isDeletebyClientId) {
				return;
			}
		} catch (error) {
			this.logger.error(`ActionRemoveUserHandler error: ${error}`);
		}
	}
}
