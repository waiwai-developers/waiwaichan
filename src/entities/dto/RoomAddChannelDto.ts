import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";

export class RoomAddChannelDto {
	constructor(
		public guildId: DiscordGuildId,
		public channelId: DiscordChannelId,
	) {}
}
