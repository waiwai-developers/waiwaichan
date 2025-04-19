import type { StickyDto } from "@/src/entities/dto/StickyDto";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";

export interface IStickyLogic {
	create(data: StickyDto): Promise<string>;
	find(
		guildId: DiscordGuildId,
		channelId: DiscordChannelId,
	): Promise<StickyDto | undefined>;
	delete(
		guildId: DiscordGuildId,
		channelId: DiscordChannelId,
		userId: DiscordUserId,
	): Promise<string>;
}
