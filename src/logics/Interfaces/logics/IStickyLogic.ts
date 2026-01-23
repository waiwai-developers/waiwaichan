import type { StickyDto } from "@/src/entities/dto/StickyDto";
import type { ChannelId } from "@/src/entities/vo/ChannelId";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { StickyMessage } from "@/src/entities/vo/StickyMessage";

export interface IStickyLogic {
	create(data: StickyDto): Promise<string>;
	find(
		communityId: CommunityId,
		channelId: ChannelId,
	): Promise<StickyDto | undefined>;
	delete(communityId: CommunityId, channelId: ChannelId): Promise<string>;
	findByCommunityId(communityId: CommunityId): Promise<StickyDto[]>;
	delete(communityId: CommunityId, channelId: ChannelId): Promise<string>;
	updateMessageId(
		communityId: CommunityId,
		channelId: ChannelId,
		messageId: DiscordMessageId,
	): Promise<string>;
	updateMessage(
		communityId: CommunityId,
		channelId: ChannelId,
		message: StickyMessage,
	): Promise<string>;
}
