import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import { ChannelId } from "@/src/entities/vo/ChannelId";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import { MessageChannelId } from "@/src/entities/vo/MessageChannelId";
import { MessageCommunityId } from "@/src/entities/vo/MessageCommunityId";
import { MessageId } from "@/src/entities/vo/MessageId";
import { MessageUserId } from "@/src/entities/vo/MessageUserId";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import { UserId } from "@/src/entities/vo/UserId";
import type { DataDeletionCircularLogic } from "@/src/logics/DataDeletionCircularLogic";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IMessageLogic } from "@/src/logics/Interfaces/logics/IMessageLogic";
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
	const messageLogic = schedulerContainer.get<IMessageLogic>(
		LogicTypes.MessageLogic,
	);
	const dataDeletionCircularLogic =
		schedulerContainer.get<DataDeletionCircularLogic>(
			LogicTypes.dataDeletionCircularLogic,
		);

	const guilds = c.guilds.cache;

	//Guildに存在しないUserとChannelとMessageの削除
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

		//ChannelのclientIdの配列の取得
		const channelIds: ChannelClientId[] = [];
		channels.forEach((channel) => {
			if (channel != null) {
				channelIds.push(new ChannelClientId(BigInt(channel.id)));
			}
		});

		//Channelの削除
		if (channelIds.length > 0) {
			await channelLogic.deleteNotBelongByCommunityIdAndClientIds(
				new ChannelCommunityId(communityId.getValue()),
				channelIds,
			);
		}

		//削除されたChannelに関連するMessagesの削除
		const deletedChannelTargets =
			await channelLogic.findDeletionTargetsByBatchStatusAndDeletedAt();
		for (const target of deletedChannelTargets) {
			await messageLogic.deleteByChannelIdAndReturnClientIds(
				new MessageChannelId(target.id.getValue()),
			);
		}

		//MemberのclientIdの配列の取得
		const memberIds: UserClientId[] = [];
		members.forEach((member) => {
			memberIds.push(new UserClientId(BigInt(member.user.id)));
		});

		//Userの削除
		if (memberIds.length > 0) {
			await userLogic.deleteNotBelongByCommunityIdAndClientIds(
				new UserCommunityId(communityId.getValue()),
				memberIds,
			);
		}

		//削除されたUserに関連するMessagesの削除
		const deletedUserTargets =
			await userLogic.findDeletionTargetsByBatchStatusAndDeletedAt();
		for (const target of deletedUserTargets) {
			await messageLogic.deleteByUserIdAndReturnClientIds(
				new MessageUserId(target.id.getValue()),
			);
		}
	}

	//Botが所属してないCommunityとCommunityのUserとChannelとMessage削除
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

		//Channelの削除
		await channelLogic.deletebyCommunityId(
			new ChannelCommunityId(communityId.getValue()),
		);

		//削除されたChannelに関連するMessagesの削除
		const deletedChannelTargetsForCommunity =
			await channelLogic.findDeletionTargetsByBatchStatusAndDeletedAt();
		for (const target of deletedChannelTargetsForCommunity) {
			await messageLogic.deleteByChannelIdAndReturnClientIds(
				new MessageChannelId(target.id.getValue()),
			);
		}

		//Userの削除
		await userLogic.deletebyCommunityId(
			new UserCommunityId(communityId.getValue()),
		);

		//削除されたUserに関連するMessagesの削除
		const deletedUserTargetsForCommunity =
			await userLogic.findDeletionTargetsByBatchStatusAndDeletedAt();
		for (const target of deletedUserTargetsForCommunity) {
			await messageLogic.deleteByUserIdAndReturnClientIds(
				new MessageUserId(target.id.getValue()),
			);
		}

		//Communityに関連するMessagesの削除
		await messageLogic.deletebyCommunityId(
			new MessageCommunityId(communityId.getValue()),
		);

		//Communityの削除
		await communityLogic.delete(
			new CommunityDto(CommunityCategoryType.Discord, cc),
		);
	}

	//削除されたCommunityやUserやChannelやMessageに関連するすべてのデータの削除
	//削除されたUserに関連するデータの削除
	const userTargets =
		await userLogic.findDeletionTargetsByBatchStatusAndDeletedAt();
	for (const target of userTargets) {
		const userId = new UserId(target.id.getValue());
		await dataDeletionCircularLogic.deleteRecordInRelatedTableUserId(userId);
		await userLogic.updatebatchStatus(userId);
	}

	//削除されたChannelに関連するデータの削除
	const channelTargets =
		await channelLogic.findDeletionTargetsByBatchStatusAndDeletedAt();
	for (const target of channelTargets) {
		const channelId = new ChannelId(target.id.getValue());
		await dataDeletionCircularLogic.deleteRecordInRelatedTableChannelId(
			channelId,
		);
		await channelLogic.updatebatchStatus(channelId);
	}

	//削除されたMessageに関連するデータの削除
	const messageTargets =
		await messageLogic.findDeletionTargetsByBatchStatusAndDeletedAt();
	for (const target of messageTargets) {
		const messageId = new MessageId(target.id.getValue());
		await dataDeletionCircularLogic.deleteRecordInRelatedTableMessageId(
			messageId,
		);
		await messageLogic.updatebatchStatus(messageId);
	}

	//削除されたCommunityに関連するデータの削除
	const communityTargets =
		await communityLogic.findDeletionTargetsByBatchStatusAndDeletedAt();
	for (const target of communityTargets) {
		const communityId = new CommunityId(target.id.getValue());
		await dataDeletionCircularLogic.deleteRecordInRelatedTableCommunityId(
			communityId,
		);
		await communityLogic.updatebatchStatus(communityId);
	}
};
