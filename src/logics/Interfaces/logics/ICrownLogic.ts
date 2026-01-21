import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { CrownMessage } from "@/src/entities/vo/CrownMessage";
import type { CrownMessageLink } from "@/src/entities/vo/CrownMessageLink";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { UserId } from "@/src/entities/vo/UserId";

export interface ICrownLogic {
	createCrownIfNotExists(
		communityId: CommunityId,
		messageId: DiscordMessageId,
		crownMessage: CrownMessage,
		crownMessageLink: CrownMessageLink,
	): Promise<string | undefined>;
}
