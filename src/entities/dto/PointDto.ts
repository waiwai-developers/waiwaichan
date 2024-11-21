import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { PointExpire } from "@/src/entities/vo/PointExpire";
import type { PointStatus } from "@/src/entities/vo/PointStatus";

export class PointDto {
	constructor(
		public receiveUserId: DiscordUserId,
		public giveUserId: DiscordUserId,
		public messageId: DiscordMessageId,
		public status: PointStatus,
		public expiredAt: PointExpire,
	) {}
}
