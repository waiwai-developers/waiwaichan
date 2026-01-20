import type { StickyDto } from "@/src/entities/dto/StickyDto";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { StickyMessage } from "@/src/entities/vo/StickyMessage";

export interface IStickyLogic {
	create(data: StickyDto): Promise<string>;
	find(
		communityId: CommunityId,
		channelId: DiscordChannelId,
	): Promise<StickyDto | undefined>;
	delete(communityId: CommunityId, channelId: DiscordChannelId): Promise<string>;
	findByCommunityId(communityId: CommunityId): Promise<StickyDto[]>;
	delete(communityId: CommunityId, channelId: DiscordChannelId): Promise<string>;
	updateMessageId(
		communityId: CommunityId,
		channelId: DiscordChannelId,
		messageId: DiscordMessageId,
	): Promise<string>;
	updateMessage(
		communityId: CommunityId,
		channelId: DiscordChannelId,
		message: StickyMessage,
	): Promise<string>;
}
