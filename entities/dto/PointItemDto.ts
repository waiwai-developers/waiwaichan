import type { DiscordUserId } from "@/entities/vo/DiscordUserId";
import type { PointItemDescription } from "../vo/PointItemDescription";
import type { PointItemId } from "../vo/PointItemId";
import type { PointItemName } from "../vo/PointItemName";
export class PointItemDto {
	constructor(
		public id: PointItemId,
		public userId: DiscordUserId,
		public name: PointItemName,
		public description: PointItemDescription,
	) {}
}
