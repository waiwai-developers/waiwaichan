import { AppConfig } from "@/src/entities/config/AppConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IStickyLogic } from "@/src/logics/Interfaces/logics/IStickyLogic";
import type { Message } from "discord.js";
import { TextChannel } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class StickyEventHandler implements DiscordEventHandler<Message> {
	@inject(LogicTypes.StickyLogic)
	private readonly stickyLogic!: IStickyLogic;

	@inject(LogicTypes.CommunityLogic)
	private readonly CommunityLogic!: ICommunityLogic;

	async handle(message: Message) {
		if (message.author.bot && message.author.id !== AppConfig.discord.clientId)
			return;
		if (message.channel.isThread()) return;

		if (!message.guildId) return;

		const communityId = await this.CommunityLogic.getId(
			new CommunityDto(
				CommunityCategoryType.Discord,
				new CommunityClientId(BigInt(message.guildId))
			)
		)
		if (communityId == null) return;

		const sticky = await this.stickyLogic.find(
			communityId,
			new DiscordChannelId(message.channelId),
		);
		if (sticky === undefined) return;

		const channel = message.guild?.channels.cache.get(
			sticky.channelId.getValue(),
		);
		if (channel === undefined) return;
		if (!(channel instanceof TextChannel)) return;

		const stickyOldMessage = await channel.messages.fetch(
			sticky.messageId.getValue(),
		);
		const success = await stickyOldMessage.delete();
		if (!success) return;

		const stickyNewMessage = await channel.send(sticky.message.getValue());
		if (!stickyNewMessage) return;

		if (!stickyNewMessage.guildId) return;

		const newCommunityId = await this.CommunityLogic.getId(
			new CommunityDto(
				CommunityCategoryType.Discord,
				new CommunityClientId(BigInt(stickyNewMessage.guildId))
			)
		)
		if (newCommunityId == null) return;

		await this.stickyLogic.update(
			newCommunityId,
			new DiscordChannelId(stickyNewMessage.channelId),
			new DiscordMessageId(stickyNewMessage.id),
		);
	}
}
