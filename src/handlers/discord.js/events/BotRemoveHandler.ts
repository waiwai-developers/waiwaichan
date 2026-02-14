import {
	LogicTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { RoleCommunityId } from "@/src/entities/vo/RoleCommunityId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IRoleLogic } from "@/src/logics/Interfaces/logics/IRoleLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { Guild } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class BotRemoveHandler implements DiscordEventHandler<Guild> {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	@inject(LogicTypes.CommunityLogic)
	private readonly CommunityLogic!: ICommunityLogic;

	@inject(LogicTypes.UserLogic)
	private readonly UserLogic!: IUserLogic;

	@inject(LogicTypes.ChannelLogic)
	private readonly ChannelLogic!: IChannelLogic;

	@inject(LogicTypes.RoleLogic)
	private readonly RoleLogic!: IRoleLogic;

	async handle(guild: Guild): Promise<void> {
		try {
			this.logger.info(
				`BotRemoveHandler: Bot was added to guild, GuildId: ${guild.id}`,
			);
			const communityId = await this.CommunityLogic.getId(
				new CommunityDto(
					CommunityCategoryType.Discord,
					new CommunityClientId(BigInt(guild.id)),
				),
			);
			if (communityId == null) {
				return;
			}

			const isDelete = await this.CommunityLogic.delete(
				new CommunityDto(
					CommunityCategoryType.Discord,
					new CommunityClientId(BigInt(guild.id)),
				),
			);
			if (!isDelete) {
				return;
			}

			const isDeletebyCommunityId = await this.UserLogic.deletebyCommunityId(
				new UserCommunityId(communityId.getValue()),
			);
			if (!isDeletebyCommunityId) {
				return;
			}

			const isChannelDeletebyCommunityId =
				await this.ChannelLogic.deletebyCommunityId(
					new ChannelCommunityId(communityId.getValue()),
				);
			if (!isChannelDeletebyCommunityId) {
				return;
			}

			const isRoleDeletebyCommunityId =
				await this.RoleLogic.deletebyCommunityId(
					new RoleCommunityId(communityId.getValue()),
				);
			if (!isRoleDeletebyCommunityId) {
				return;
			}
		} catch (error) {
			this.logger.error(`BotRemoveHandler error: ${error}`);
		}
	}
}
