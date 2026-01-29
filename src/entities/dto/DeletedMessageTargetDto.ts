import type { MessageClientId } from "@/src/entities/vo/MessageClientId";
import type { MessageId } from "@/src/entities/vo/MessageId";

export type DeletedMessageTargetDto = {
	id: MessageId;
	clientId: MessageClientId;
};
