import {
	LogicTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { RoleDto } from "@/src/entities/dto/RoleDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { RoleCategoryType } from "@/src/entities/vo/RoleCategoryType";
import { RoleClientId } from "@/src/entities/vo/RoleClientId";
import { RoleCommunityId } from "@/src/entities/vo/RoleCommunityId";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IRoleLogic } from "@/src/logics/Interfaces/logics/IRoleLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import type { Role } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class RoleCreateHandler implements DiscordEventHandler<Role> {
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	@inject(LogicTypes.CommunityLogic)
	private readonly CommunityLogic!: ICommunityLogic;

	@inject(LogicTypes.RoleLogic)
	private readonly RoleLogic!: IRoleLogic;

	async handle(role: Role): Promise<void> {
		try {
			this.logger.info(
				`RoleCreateHandler: Role was created, guildId: ${role.guild.id}, roleId: ${role.id}`,
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

			const isBulkCreate = await this.RoleLogic.bulkCreate([
				new RoleDto(
					RoleCategoryType.Discord,
					new RoleClientId(BigInt(role.id)),
					new RoleCommunityId(communityId.getValue()),
				),
			]);
			if (!isBulkCreate) {
				return;
			}
		} catch (error) {
			this.logger.error(`RoleCreateHandler error: ${error}`);
		}
	}
}
