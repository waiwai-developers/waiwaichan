import type { StickyDto } from "@/src/entities/dto/StickyDto";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { StickyMessage } from "@/src/entities/vo/StickyMessage";

export interface IStickyRepository {
	create(data: StickyDto): Promise<boolean>;
	findOne(
		communityId: CommunityId,
		channelId: DiscordChannelId,
	): Promise<StickyDto | undefined>;
	findByCommunityId(guildId: DiscordGuildId): Promise<StickyDto[]>;
	delete(
		communityId: CommunityId,
		channelId: DiscordChannelId,
	): Promise<boolean>;
	updateForMessageId(
		communityId: CommunityId,
		channelId: DiscordChannelId,
		messageId: DiscordMessageId,
	): Promise<boolean>;
	updateForMessage(
		guildId: DiscordGuildId,
		channelId: DiscordChannelId,
		message: StickyMessage,
	): Promise<boolean>;
}
