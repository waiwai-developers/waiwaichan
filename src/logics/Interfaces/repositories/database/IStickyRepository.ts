import type { StickyDto } from "@/src/entities/dto/StickyDto";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { StickyMessage } from "@/src/entities/vo/StickyMessage";

export interface IStickyRepository {
	create(data: StickyDto): Promise<boolean>;
	findOne(
		guildId: DiscordGuildId,
		channelId: DiscordChannelId,
	): Promise<StickyDto | undefined>;
	findByCommunityId(
		guildId: DiscordGuildId,
	): Promise<StickyDto[]>;
	delete(
		guildId: DiscordGuildId,
		channelId: DiscordChannelId,
	): Promise<boolean>;
	updateForMessageId(
		guildId: DiscordGuildId,
		channelId: DiscordChannelId,
		messageId: DiscordMessageId,
	): Promise<boolean>;
	updateForMessage(
		guildId: DiscordGuildId,
		channelId: DiscordChannelId,
		message: StickyMessage,
	): Promise<boolean>;
}
