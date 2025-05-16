import type { StickyDto } from "@/src/entities/dto/StickyDto";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";

export interface IStickyLogic {
	create(data: StickyDto): Promise<string>;
	find(
		communityId: CommunityId,
		channelId: DiscordChannelId,
	): Promise<StickyDto | undefined>;
	delete(communityId: CommunityId, channelId: DiscordChannelId): Promise<string>;
	update(
		communityId: CommunityId,
		channelId: DiscordChannelId,
		messageId: DiscordMessageId,
	): Promise<string>;
}
