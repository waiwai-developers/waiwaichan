import type { CandyExpire } from "@/src/entities/vo/CandyExpire";
import type { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";

export class CandyDto {
	constructor(
		public guildId: DiscordGuildId,
		public receiveUserId: DiscordUserId,
		public giveUserId: DiscordUserId,
		public messageId: DiscordMessageId,
		public expiredAt: CandyExpire,
	) {}
}
