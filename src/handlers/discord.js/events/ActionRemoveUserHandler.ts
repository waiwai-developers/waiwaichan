import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { UserDto } from "@/src/entities/dto/UserDto";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityClientId } from "@/src/entities/vo/UserCommunityClientId";
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
				`ActionRemoveBotHandler: Bot was added to guild ${member.guild.id}`,
			);
			await this.UserLogic.delete(
				new UserDto(
					UserCategoryType.Discord,
					new UserClientId(member.id),
					new UserCommunityClientId(member.guild.id),
				),
			);
		} catch (error) {
			this.logger.error(`ActionRemoveBotHandler error: ${error}`);
		}
	}
}
