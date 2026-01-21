import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { StickyMessage } from "@/src/entities/vo/StickyMessage";
import type { UserId } from "@/src/entities/vo/UserId";
import type { CommunityId } from "../vo/CommunityId";

export class StickyDto {
	constructor(
		public communityId: CommunityId,
		public channelId: DiscordChannelId,
		public userId: UserId,
		public messageId: DiscordMessageId,
		public message: StickyMessage,
	) {}
}
