import type { CrownDto } from "@/src/entities/dto/CrownDto";
import type { CrownMessage } from "@/src/entities/vo/CrownMessage";
import type { CrownMessageLink } from "@/src/entities/vo/CrownMessageLink";
import type { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";

export interface ICrownLogic {
	createCrownIfNotExists(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
		messageId: DiscordMessageId,
		crownMessage: CrownMessage,
		crownMessageLink: CrownMessageLink,
	): Promise<string | undefined>;
}
