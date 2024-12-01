import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { PointItemDescription } from "@/src/entities/vo/PointItemDescription";
import type { PointItemId } from "@/src/entities/vo/PointItemId";
import type { PointItemName } from "@/src/entities/vo/PointItemName";
export class PointItemDto {
	constructor(
		public id: PointItemId,
		public name: PointItemName,
		public description: PointItemDescription,
	) {}
}
