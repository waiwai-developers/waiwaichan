import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { UserDto } from "@/src/entities/dto/UserDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import { UserType } from "@/src/entities/vo/UserType";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { Guild } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class ActionAddBotHandler implements DiscordEventHandler<Guild> {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	@inject(LogicTypes.CommunityLogic)
	private readonly CommunityLogic!: ICommunityLogic;

	@inject(LogicTypes.UserLogic)
	private readonly UserLogic!: IUserLogic;

	async handle(guild: Guild): Promise<void> {
		try {
			this.logger.info(
				`ActionAddBotHandler: Bot was added to guild, guildId: ${guild.id}`,
			);
			const communityId = await this.CommunityLogic.create(
				new CommunityDto(
					CommunityCategoryType.Discord,
					new CommunityClientId(BigInt(guild.id)),
				),
			);
			if (communityId == null) {
				return;
			}

			const members = await guild.members.fetch();
			await this.UserLogic.bulkCreate(
				members.map(
					(m) =>
						new UserDto(
							UserCategoryType.Discord,
							new UserClientId(BigInt(m.id)),
							m.user.bot ? UserType.bot : UserType.user,
							new UserCommunityId(communityId.getValue()),
						),
				),
			);
		} catch (error) {
			this.logger.error(`ActionAddBotHandler error: ${error}`);
		}
	}
}
