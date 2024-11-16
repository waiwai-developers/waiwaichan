import type { DiscordMessageId } from "@/entities/vo/DiscordMessageId";
import type { DiscordUserId } from "@/entities/vo/DiscordUserId";
import type { PointExpire } from "@/entities/vo/PointExpire";
import type { PointStatus } from "@/entities/vo/PointStatus";

export class PointDto {
	constructor(
		public receiveUserId: DiscordUserId,
		public giveUserId: DiscordUserId,
		public messageId: DiscordMessageId,
		public status: PointStatus,
		public expiredAt: PointExpire,
	) {}
}
