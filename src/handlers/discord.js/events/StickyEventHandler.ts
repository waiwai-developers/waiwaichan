import { AppConfig } from "@/src/entities/config/AppConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { IStickyLogic } from "@/src/logics/Interfaces/logics/IStickyLogic";
import type { Message } from "discord.js";
import { TextChannel } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class StickyEventHandler implements DiscordEventHandler<Message> {
	@inject(LogicTypes.StickyLogic)
	private readonly stickyLogic!: IStickyLogic;

	async handle(message: Message) {
		if (!message.guildId) {
			return;
		}
		if (message.author.bot) return;
		if (message.channel.isThread()) return;

		const sticky = await this.stickyLogic.find(
			new DiscordGuildId(message.guildId),
			new DiscordChannelId(message.channelId),
		);
		if (sticky === undefined) return;

		const channel = message.guild?.channels.cache.get(
			sticky.channelId.getValue(),
		);
		if (channel == null) return;
		if (!(channel instanceof TextChannel)) return;

		const stickyOldMessage = await channel.messages.fetch(
			sticky.messageId.getValue(),
		);
		const success = await stickyOldMessage.delete();
		if (!success) return;

		const stickyNewMessage = await channel.send(sticky.message.getValue());
		if (!stickyNewMessage) return;

		await this.stickyLogic.updateMessageId(
			new DiscordGuildId(stickyNewMessage.guildId),
			new DiscordChannelId(stickyNewMessage.channelId),
			new DiscordMessageId(stickyNewMessage.id),
		);
	}
}
