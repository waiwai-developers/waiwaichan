import type { CandyItemDescription } from "@/src/entities/vo/CandyItemDescription";
import type { CandyItemId } from "@/src/entities/vo/CandyItemId";
import type { CandyItemName } from "@/src/entities/vo/CandyItemName";
export class CandyItemDto {
	constructor(
		public id: CandyItemId,
		public name: CandyItemName,
		public description: CandyItemDescription,
	) {}
}
