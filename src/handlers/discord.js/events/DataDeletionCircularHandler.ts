import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import { ChannelId } from "@/src/entities/vo/ChannelId";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import { UserId } from "@/src/entities/vo/UserId";
import type { DataDeletionCircularLogic } from "@/src/logics/DataDeletionCircularLogic";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import { schedulerContainer } from "@/src/scheduler.di.config";
import type { Client } from "discord.js";

export const DataDeletionCircularHandler = async (c: Client<boolean>) => {
	const communityLogic = schedulerContainer.get<ICommunityLogic>(
		LogicTypes.CommunityLogic,
	);
	const userLogic = schedulerContainer.get<IUserLogic>(LogicTypes.UserLogic);
	const channelLogic = schedulerContainer.get<IChannelLogic>(
		LogicTypes.ChannelLogic,
	);
	const dataDeletionCircularLogic =
		schedulerContainer.get<DataDeletionCircularLogic>(
			LogicTypes.dataDeletionCircularLogic,
		);

	const guilds = c.guilds.cache;

	//Guildに存在しないUserとChannelの削除
	for (const g of guilds.values()) {
		const guild = await c.guilds.fetch(g.id);
		const members = await guild.members.fetch();
		const channels = await guild.channels.fetch();

		//GuildのCommunityIdの取得
		const communityId = await communityLogic.getId(
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
		await userLogic.deleteNotBelongByCommunityIdAndClientIds(
			communityId,
			memberIds,
		);

		//ChannelのclientIdの配列の取得
		const channelIds: ChannelClientId[] = [];
		channels.forEach((channel) => {
			if (channel != null) {
				channelIds.push(new ChannelClientId(BigInt(channel.id)));
			}
		});
		if (channelIds.length === 0) {
			continue;
		}

		//Channelの削除
		await channelLogic.deleteNotBelongByCommunityIdAndClientIds(
			new ChannelCommunityId(communityId.getValue()),
			channelIds,
		);
	}

	//Botが所属してないCommunityとCommunityのUserとChannel削除
	const communityClientIds = await communityLogic.getNotExistClientId(
		CommunityCategoryType.Discord,
		guilds.map((g) => new CommunityClientId(BigInt(g.id))),
	);
	for (const cc of communityClientIds) {
		const communityId = await communityLogic.getId(
			new CommunityDto(CommunityCategoryType.Discord, cc),
		);
		if (communityId == null) {
			continue;
		}

		//Userの削除
		await userLogic.deletebyCommunityId(
			new UserCommunityId(communityId.getValue()),
		);

		//Channelの削除
		await channelLogic.deletebyCommunityId(
			new ChannelCommunityId(communityId.getValue()),
		);

		//Communityの削除
		await communityLogic.delete(
			new CommunityDto(CommunityCategoryType.Discord, cc),
		);
	}

	//削除されたUserに関連するデータの削除
	const userTargets =
		await userLogic.findDeletionTargetsByBatchStatusAndDeletedAt();
	for (const target of userTargets) {
		await dataDeletionCircularLogic.deleteRecordInRelatedTableUserId(
			new UserId(target.id.getValue()),
		);
	}

	//削除されたCommunityに関連するデータの削除
	const communityTargets =
		await communityLogic.findDeletionTargetsByBatchStatusAndDeletedAt();
	for (const target of communityTargets) {
		await dataDeletionCircularLogic.deleteRecordInRelatedTableCommunityId(
			new CommunityId(target.id.getValue()),
		);
	}

	//削除されたChannelに関連するデータの削除
	const channelTargets =
		await channelLogic.findDeletionTargetsByBatchStatusAndDeletedAt();
	for (const target of channelTargets) {
		await dataDeletionCircularLogic.deleteRecordInRelatedTableChannelId(
			new ChannelId(target.id.getValue()),
		);
	}
};
