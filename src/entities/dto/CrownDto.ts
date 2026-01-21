import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";

export class CrownDto {
	constructor(
		public communityId: CommunityId,
		public messageId: DiscordMessageId,
	) {}
}
