import type { CommunityId } from "@/src/entities/vo/CommunityId";
import type { CrownMessage } from "@/src/entities/vo/CrownMessage";
import type { CrownMessageLink } from "@/src/entities/vo/CrownMessageLink";
import type { MessageId } from "@/src/entities/vo/MessageId";

export interface ICrownLogic {
	createCrownIfNotExists(
		communityId: CommunityId,
		messageId: MessageId,
		crownMessage: CrownMessage,
		crownMessageLink: CrownMessageLink,
	): Promise<string | undefined>;
}
