import { PointItemDescription } from "../vo/PointItemDescription";
import { PointItemId } from "../vo/PointItemId";
import { PointItemName } from "../vo/PointItemName";
export class PointItemDto {
	constructor(
		public id: PointItemId,
		public name: PointItemName,
		public description: PointItemDescription,
	) {}
	static from(id: number, name: string, description: string): PointItemDto {
		return new PointItemDto(
			new PointItemId(id),
			new PointItemName(name),
			new PointItemDescription(description),
		);
	}
}
