import { AppConfig } from "@/src/entities/config/AppConfig";
import { LogicTypes, RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
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

	@inject(LogicTypes.CommunityLogic)
	private readonly CommunityLogic!: ICommunityLogic;

	async handle(member: GuildMember): Promise<void> {
		try {
			if (member.id === AppConfig.discord.clientId) {
				return;
			}
			this.logger.info(
				`ActionRemoveUserHandler: User was removed from guild, guildId: ${member.guild.id}`,
			);

			const communityId = await this.CommunityLogic.getId(
				new CommunityDto(
					CommunityCategoryType.Discord,
					new CommunityClientId(BigInt(member.guild.id)),
				),
			);

			if (communityId == null) {
				return;
			}

			const isDeletebyClientId = await this.UserLogic.deletebyClientId(
				new UserCommunityId(communityId.getValue()),
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
