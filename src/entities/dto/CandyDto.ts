import type { CandyExpire } from "@/src/entities/vo/CandyExpire";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";

export class CandyDto {
	constructor(
		public receiveUserId: DiscordUserId,
		public giveUserId: DiscordUserId,
		public messageId: DiscordMessageId,
		public expiredAt: CandyExpire,
	) {}
}
