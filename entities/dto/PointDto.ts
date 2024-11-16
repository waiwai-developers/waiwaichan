import type { DiscordMessageId } from "../vo/DiscordMessageId";
import type { DiscordUserId } from "../vo/DiscordUserId";
import type { PointExpire } from "../vo/PointExpire";
import type { PointStatus } from "../vo/PointStatus";

export class PointDto {
	constructor(
		public receiveUserId: DiscordUserId,
		public giveUserId: DiscordUserId,
		public messageId: DiscordMessageId,
		public status: PointStatus,
		public expiredAt: PointExpire,
	) {}
}
