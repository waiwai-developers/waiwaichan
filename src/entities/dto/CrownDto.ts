import type { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";

export class CrownDto {
	constructor(
		public guildId: DiscordGuildId,
		public messageId: DiscordMessageId,
	) {}
}
