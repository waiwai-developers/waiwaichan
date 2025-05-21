import type { StickyDto } from "@/src/entities/dto/StickyDto";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { StickyMessage } from "@/src/entities/vo/StickyMessage";

export interface IStickyLogic {
	create(data: StickyDto): Promise<string>;
	find(
		guildId: DiscordGuildId,
		channelId: DiscordChannelId,
	): Promise<StickyDto | undefined>;
	findByCommunityId(
		guildId: DiscordGuildId,
	): Promise<StickyDto[]>;
	delete(guildId: DiscordGuildId, channelId: DiscordChannelId): Promise<string>;
	updateMessageId(
		guildId: DiscordGuildId,
		channelId: DiscordChannelId,
		messageId: DiscordMessageId,
	): Promise<string>;
	updateMessage(
		guildId: DiscordGuildId,
		channelId: DiscordChannelId,
		message: StickyMessage,
	): Promise<string>;
}
