import {
	LogicTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { RoleClientId } from "@/src/entities/vo/RoleClientId";
import { RoleCommunityId } from "@/src/entities/vo/RoleCommunityId";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { IRoleLogic } from "@/src/logics/Interfaces/logics/IRoleLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { Role } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class RoleDeleteHandler implements DiscordEventHandler<Role> {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	@inject(LogicTypes.RoleLogic)
	private readonly RoleLogic!: IRoleLogic;

	@inject(LogicTypes.CommunityLogic)
	private readonly CommunityLogic!: ICommunityLogic;

	async handle(role: Role): Promise<void> {
		try {
			this.logger.info(
				`RoleDeleteHandler: Role was deleted, guildId: ${role.guild.id}, roleId: ${role.id}`,
			);

			const communityId = await this.CommunityLogic.getId(
				new CommunityDto(
					CommunityCategoryType.Discord,
					new CommunityClientId(BigInt(role.guild.id)),
				),
			);

			if (communityId == null) {
				return;
			}

			// ロールを削除
			const isDeletebyClientId =
				await this.RoleLogic.deleteByCommunityIdAndClientId(
					new RoleCommunityId(communityId.getValue()),
					new RoleClientId(BigInt(role.id)),
				);
			if (!isDeletebyClientId) {
				return;
			}
		} catch (error) {
			this.logger.error(`RoleDeleteHandler error: ${error}`);
		}
	}
}
