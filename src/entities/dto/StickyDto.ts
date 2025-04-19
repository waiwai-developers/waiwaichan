import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";

export class StickyDto {
	constructor(
		public guildId: DiscordGuildId,
		public channelId: DiscordChannelId,
		public userId: DiscordUserId,
		public messageId: DiscordMessageId,
	) {}
}
