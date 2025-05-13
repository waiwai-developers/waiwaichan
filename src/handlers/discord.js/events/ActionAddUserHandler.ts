import { AppConfig } from "@/src/entities/config/AppConfig";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { UserDto } from "@/src/entities/dto/UserDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { GuildMember } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class ActionAddUserHandler implements DiscordEventHandler<GuildMember> {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	@inject(LogicTypes.CommunityLogic)
	private readonly CommunityLogic!: ICommunityLogic;

	@inject(LogicTypes.UserLogic)
	private readonly UserLogic!: IUserLogic;

	async handle(member: GuildMember): Promise<void> {
		try {
			if (member.id === AppConfig.discord.clientId) {
				return;
			}
			this.logger.info(
				`ActionAddUserHandler: User was added to guild ${member.guild.id}`,
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

			const isBulkCreate = await this.UserLogic.bulkCreate([
				new UserDto(
					UserCategoryType.Discord,
					new UserClientId(BigInt(member.id)),
					new UserCommunityId(communityId.getValue()),
				),
			]);
			if (!isBulkCreate) {
				return;
			}
		} catch (error) {
			this.logger.error(`ActionAddUserHandler error: ${error}`);
		}
	}
}
