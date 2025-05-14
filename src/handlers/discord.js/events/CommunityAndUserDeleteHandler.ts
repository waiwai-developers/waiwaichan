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
			SchedulerRepoTypes.ReminderSchedulerRepository,
		);
		const user = schedulerContainer.get<IUserRepository>(
			SchedulerRepoTypes.ReminderSchedulerRepository,
		);
		const dataDeletionCircular = schedulerContainer.get<IDataDeletionCircular>(
			SchedulerRepoTypes.ReminderSchedulerRepository,
		);
		const guilds = c.guilds.cache;

		//Guildに存在しないUserの削除
		guilds.map(async (g) => {
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
				return undefined;
			}

			//MemberのclientIdの配列の取得
			const memberIds: UserClientId[] = [];
			members.forEach((member) => {
				memberIds.push(new UserClientId(BigInt(member.user.id)));
			});
			if (memberIds.length > 0) {
				return undefined;
			}

			//Userの削除
			await user.deleteByCommunityIdAndClientIds(communityId, memberIds);
		});

		//Botが所属してないCommunityとCommunityのUser削除
		const communityClientIds = await community.getNotExistClientId(
			CommunityCategoryType.Discord,
			guilds.map((g) => new CommunityClientId(BigInt(g.id))),
		);
		communityClientIds.map(async (cc) => {
			const communityId = await community.getId(
				new CommunityDto(CommunityCategoryType.Discord, cc),
			);
			if (communityId == null) {
				return undefined;
			}

			//Userの削除
			await user.deletebyCommunityId(
				new UserCommunityId(communityId.getValue()),
			);

			//Communityの削除
			await community.delete(
				new CommunityDto(CommunityCategoryType.Discord, cc),
			);
		});

		// TODO: 削除されたUserに関連するDataの削除
		// 注意: deleteRecordInRelatedTableUserIdメソッドには引数としてUserIdが必要です
		// 例: const userId = new UserId(1);
		// await dataDeletionCircular.deleteRecordInRelatedTableUserId(userId);

		// TODO: 削除されたCommunityに関連するDataの削除
		// 注意: deleteRecordInRelatedTableCommunityIdメソッドには引数としてCommunityIdが必要です
		// 例: const communityId = new CommunityId(1);
		// await dataDeletionCircular.deleteRecordInRelatedTableCommunityId(communityId);
	});
};
