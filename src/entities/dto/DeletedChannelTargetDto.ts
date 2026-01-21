import type { ChannelClientId } from "@/src/entities/vo/ChannelClientId";
import type { ChannelId } from "@/src/entities/vo/ChannelId";

export type DeletedChannelTargetDto = {
	id: ChannelId;
	clientId: ChannelClientId;
};
