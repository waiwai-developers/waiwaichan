import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { ReceiveDiscordUserName } from "@/src/entities/vo/ReceiveDiscordUserName";
import type { RemindTime } from "@/src/entities/vo/RemindTime";
import type { ReminderId } from "@/src/entities/vo/ReminderId";
import type { ReminderMessage } from "@/src/entities/vo/ReminderMessage";

export interface IReminderLogic {
	create(
		channelId: DiscordChannelId,
		userId: DiscordUserId,
		receiveUserName: ReceiveDiscordUserName,
		message: ReminderMessage,
		remindAt: RemindTime,
	): Promise<string>;
	list(userId: DiscordUserId): Promise<string>;
	delete(id: ReminderId, userId: DiscordUserId): Promise<string>;
}
