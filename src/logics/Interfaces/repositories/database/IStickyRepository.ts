import type { StickyDto } from "@/src/entities/dto/StickyDto";
import type { ChannelId } from "@/src/entities/vo/ChannelId";
import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { StickyMessage } from "@/src/entities/vo/StickyMessage";

export interface IStickyRepository {
	create(data: StickyDto): Promise<boolean>;
	findOne(
		communityId: CommunityId,
		channelId: ChannelId,
	): Promise<StickyDto | undefined>;
	findByCommunityId(communityId: CommunityId): Promise<StickyDto[]>;
	delete(communityId: CommunityId, channelId: ChannelId): Promise<boolean>;
	updateForMessageId(
		communityId: CommunityId,
		channelId: ChannelId,
		messageId: DiscordMessageId,
	): Promise<boolean>;
	updateForMessage(
		communityId: CommunityId,
		channelId: ChannelId,
		message: StickyMessage,
	): Promise<boolean>;
}
