import type { DiscordUserId } from "@/entities/vo/DiscordUserId";
import type { PointItemDescription } from "@/entities/vo/PointItemDescription";
import type { PointItemId } from "@/entities/vo/PointItemId";
import type { PointItemName } from "@/entities/vo/PointItemName";
export class PointItemDto {
	constructor(
		public id: PointItemId,
		public userId: DiscordUserId,
		public name: PointItemName,
		public description: PointItemDescription,
	) {}
}
