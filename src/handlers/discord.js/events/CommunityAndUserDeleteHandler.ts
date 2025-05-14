import {
	LogicTypes,
	RepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import type { IDataDeletionCircular } from "@/src/logics/Interfaces/repositories/database/IDataDeletionCircular";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import { schedulerContainer } from "@/src/scheduler.di.config";
import type { Client } from "discord.js";

import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import { inject, injectable } from "inversify";
import type { DiscordEventHandler } from "./DiscordEventHandler";

@injectable()
export class CommunityAndUserDeleteHandler
	implements DiscordEventHandler<Client<boolean>>
{
	@inject(RepoTypes.Logger)
	private readonly logger!: ILogger;

	@inject(LogicTypes.CommunityLogic)
	private readonly CommunityLogic!: ICommunityLogic;

	@inject(LogicTypes.UserLogic)
	private readonly UserLogic!: IUserLogic;

	@inject(RepoTypes.DataDeletionCircular)
	private readonly DataDeletionCircular!: IDataDeletionCircular;

	async handle(c: Client<boolean>): Promise<void> {
		const t = schedulerContainer.get<ITransaction>(RepoTypes.Transaction);
		await t.startTransaction(async () => {
			const guilds = c.guilds.cache;

			//Guildに存在しないUserの削除
			for (const g of guilds.values()) {
				const guild = await c.guilds.fetch(g.id);
				const members = await guild.members.fetch();

				//GuildのCommunityIdの取得
				const communityId = await this.CommunityLogic.getId(
					new CommunityDto(
						CommunityCategoryType.Discord,
						new CommunityClientId(BigInt(guild.id)),
					),
				);
				if (communityId == null) {
					continue;
				}

				//MemberのclientIdの配列の取得
				const memberIds: UserClientId[] = [];
				members.forEach((member) => {
					memberIds.push(new UserClientId(BigInt(member.user.id)));
				});
				if (memberIds.length === 0) {
					continue;
				}

				//Userの削除
				await this.UserLogic.deleteByCommunityIdAndClientIds(
					communityId,
					memberIds,
				);
			}

			//Botが所属してないCommunityとCommunityのUser削除
			const communityClientIds = await this.CommunityLogic.getNotExistClientId(
				CommunityCategoryType.Discord,
				guilds.map((g) => new CommunityClientId(BigInt(g.id))),
			);
			for (const cc of communityClientIds) {
				const communityId = await this.CommunityLogic.getId(
					new CommunityDto(CommunityCategoryType.Discord, cc),
				);
				if (communityId == null) {
					continue;
				}

				//Userの削除
				await this.UserLogic.deletebyCommunityId(
					new UserCommunityId(communityId.getValue()),
				);

				//Communityの削除
				await this.CommunityLogic.delete(
					new CommunityDto(CommunityCategoryType.Discord, cc),
				);
			}

			//削除されたUserに関連するデータの削除
			const userIds = await this.UserLogic.findByBatchStatusAndDeletedAt();
			for (const u of userIds) {
				await this.DataDeletionCircular.deleteRecordInRelatedTableUserId(u);
			}

			//削除されたにCommunity関連するデータの削除
			const communityIds =
				await this.CommunityLogic.findByBatchStatusAndDeletedAt();
			for (const c of communityIds) {
				await this.DataDeletionCircular.deleteRecordInRelatedTableCommunityId(
					c,
				);
			}
		});
	}
}
