import {
	RepoTypes,
	SchedulerRepoTypes,
} from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import type { ICommunityRepository } from "@/src/logics/Interfaces/repositories/database/ICommunityRepository";
import type { IDataDeletionCircular } from "@/src/logics/Interfaces/repositories/database/IDataDeletionCircular";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import type { IUserRepository } from "@/src/logics/Interfaces/repositories/database/IUserRepository";
import { schedulerContainer } from "@/src/scheduler.di.config";
import type { Client } from "discord.js";

export const CommunityAndUserDeleteHandler = async (c: Client<boolean>) => {
	const t = schedulerContainer.get<ITransaction>(RepoTypes.Transaction);
	await t.startTransaction(async () => {
		const community = schedulerContainer.get<ICommunityRepository>(
			RepoTypes.CommunityRepository,
		);
		const user = schedulerContainer.get<IUserRepository>(
			RepoTypes.UserRepository,
		);
		const dataDeletionCircular = schedulerContainer.get<IDataDeletionCircular>(
			RepoTypes.DataDeletionCircular,
		);
		const guilds = c.guilds.cache;

		//Guildに存在しないUserの削除
		for (const g of guilds.values()) {
			const guild = await c.guilds.fetch(g.id);
			const members = await guild.members.fetch();

			//GuildのCommunityIdの取得
			const communityId = await community.getId(
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
			await user.deleteByCommunityIdAndClientIds(communityId, memberIds);
		}

		//Botが所属してないCommunityとCommunityのUser削除
		const communityClientIds = await community.getNotExistClientId(
			CommunityCategoryType.Discord,
			guilds.map((g) => new CommunityClientId(BigInt(g.id))),
		);
		for (const cc of communityClientIds) {
			const communityId = await community.getId(
				new CommunityDto(CommunityCategoryType.Discord, cc),
			);
			if (communityId == null) {
				continue;
			}

			//Userの削除
			await user.deletebyCommunityId(
				new UserCommunityId(communityId.getValue()),
			);

			//Communityの削除
			await community.delete(
				new CommunityDto(CommunityCategoryType.Discord, cc),
			);
		}

		const userIds = await user.findByBatchStatusAndDeletedAt();
		for (const u of userIds) {
			await dataDeletionCircular.deleteRecordInRelatedTableUserId(u);
		}

		const communityIds = await community.findByBatchStatusAndDeletedAt();
		for (const c of communityIds) {
			await dataDeletionCircular.deleteRecordInRelatedTableCommunityId(c);
		}
	});
};
