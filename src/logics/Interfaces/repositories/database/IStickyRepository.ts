import type { StickyDto } from "@/src/entities/dto/StickyDto";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";

export interface IStickyRepository {
	create(data: StickyDto): Promise<boolean>;
	findOne(
		communityId: CommunityId,
		channelId: DiscordChannelId,
	): Promise<StickyDto | undefined>;
	delete(
		communityId: CommunityId,
		channelId: DiscordChannelId,
	): Promise<boolean>;
	updateForMessageId(
		communityId: CommunityId,
		channelId: DiscordChannelId,
		messageId: DiscordMessageId,
	): Promise<boolean>;
}
