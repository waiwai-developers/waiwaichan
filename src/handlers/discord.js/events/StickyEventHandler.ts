import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { ChannelDto } from "@/src/entities/dto/ChannelDto";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { MessageDto } from "@/src/entities/dto/MessageDto";
import { UserDto } from "@/src/entities/dto/UserDto";
import { ChannelCategoryType } from "@/src/entities/vo/ChannelCategoryType";
import { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import { ChannelCommunityId } from "@/src/entities/vo/ChannelCommunityId";
import { ChannelType } from "@/src/entities/vo/ChannelType";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { MessageCategoryType } from "@/src/entities/vo/MessageCategoryType";
import { MessageChannelId } from "@/src/entities/vo/MessageChannelId";
import { MessageClientId } from "@/src/entities/vo/MessageClientId";
import { MessageCommunityId } from "@/src/entities/vo/MessageCommunityId";
import { MessageUserId } from "@/src/entities/vo/MessageUserId";
import { UserCategoryType } from "@/src/entities/vo/UserCategoryType";
import { UserClientId } from "@/src/entities/vo/UserClientId";
import { UserCommunityId } from "@/src/entities/vo/UserCommunityId";
import { UserType } from "@/src/entities/vo/UserType";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { IChannelLogic } from "@/src/logics/Interfaces/logics/IChannelLogic";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IMessageLogic } from "@/src/logics/Interfaces/logics/IMessageLogic";
import type { IStickyLogic } from "@/src/logics/Interfaces/logics/IStickyLogic";
import type { IUserLogic } from "@/src/logics/Interfaces/logics/IUserLogic";
import type { Message } from "discord.js";
import { TextChannel } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class StickyEventHandler implements DiscordEventHandler<Message> {
	@inject(LogicTypes.StickyLogic)
	private readonly stickyLogic!: IStickyLogic;

	@inject(LogicTypes.CommunityLogic)
	private readonly CommunityLogic!: ICommunityLogic;

	@inject(LogicTypes.ChannelLogic)
	private readonly ChannelLogic!: IChannelLogic;

	@inject(LogicTypes.MessageLogic)
	private readonly MessageLogic!: IMessageLogic;

	@inject(LogicTypes.UserLogic)
	private readonly UserLogic!: IUserLogic;

	async handle(message: Message) {
		if (!message.guildId) {
			return;
		}
		if (message.author.bot) return;
		if (message.channel.isThread()) return;

		if (!message.guildId) return;

		const communityId = await this.CommunityLogic.getId(
			new CommunityDto(
				CommunityCategoryType.Discord,
				new CommunityClientId(BigInt(message.guildId)),
			),
		);
		if (communityId == null) return;

		const channelId = await this.ChannelLogic.getId(
			new ChannelDto(
				ChannelCategoryType.Discord,
				new ChannelClientId(BigInt(message.channelId)),
				ChannelType.DiscordText,
				new ChannelCommunityId(communityId.getValue()),
			),
		);
		if (channelId == null) return;

		const sticky = await this.stickyLogic.find(communityId, channelId);
		if (sticky === undefined) return;

		const channel = message.guild?.channels.cache.get(message.channelId);
		if (channel == null) return;
		if (!(channel instanceof TextChannel)) return;

		// MessageテーブルからclientIdを取得
		const stickyOldMessageClientId = await this.MessageLogic.getClientIdById(
			sticky.messageId,
		);
		if (stickyOldMessageClientId == null) return;

		const stickyOldMessage = await channel.messages.fetch(
			stickyOldMessageClientId.getValue().toString(),
		);
		const success = await stickyOldMessage.delete();
		if (!success) return;

		const stickyNewMessage = await channel.send(sticky.message.getValue());
		if (!stickyNewMessage) return;

		if (!stickyNewMessage.guildId) return;

		const newCommunityId = await this.CommunityLogic.getId(
			new CommunityDto(
				CommunityCategoryType.Discord,
				new CommunityClientId(BigInt(stickyNewMessage.guildId)),
			),
		);
		if (newCommunityId == null) return;

		const newChannelId = await this.ChannelLogic.getId(
			new ChannelDto(
				ChannelCategoryType.Discord,
				new ChannelClientId(BigInt(stickyNewMessage.channelId)),
				ChannelType.DiscordText,
				new ChannelCommunityId(newCommunityId.getValue()),
			),
		);
		if (newChannelId == null) return;

		const userId = await this.UserLogic.getId(
			new UserDto(
				UserCategoryType.Discord,
				new UserClientId(BigInt(stickyNewMessage.author.id)),
				UserType.bot,
				new UserCommunityId(newCommunityId.getValue()),
			),
		);
		if (userId == null) return;

		// 新しいメッセージをMessageテーブルに登録
		const newMessageId = await this.MessageLogic.findOrCreate(
			new MessageDto(
				MessageCategoryType.Discord,
				new MessageClientId(BigInt(stickyNewMessage.id)),
				new MessageCommunityId(newCommunityId.getValue()),
				new MessageUserId(userId.getValue()),
				new MessageChannelId(newChannelId.getValue()),
			),
		);

		await this.stickyLogic.updateMessageId(
			communityId,
			newChannelId,
			newMessageId,
		);
	}
}
