import type { DiscordUserId } from "@/entities/vo/DiscordUserId";
import type { UserPointItemId } from "@/entities/vo/UserPointItemId";

interface IPointLogics {
	check(userId: DiscordUserId): string;
	exchange(userId: DiscordUserId, UserPointItemId: UserPointItemId): string;
	drawItem(userId: DiscordUserId): string;
	getItems(userId: DiscordUserId): string;
}
