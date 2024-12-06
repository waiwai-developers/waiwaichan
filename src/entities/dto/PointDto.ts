import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { PointExpire } from "@/src/entities/vo/PointExpire";

export class PointDto {
	constructor(
		public receiveUserId: DiscordUserId,
		public giveUserId: DiscordUserId,
		public messageId: DiscordMessageId,
		public expiredAt: PointExpire,
	) {}
}
