import type { PointItemDescription } from "../vo/PointItemDescription";
import type { PointItemId } from "../vo/PointItemId";
import type { PointItemName } from "../vo/PointItemName";

export type PointItemDto = {
	id: PointItemId;
	name: PointItemName;
	description: PointItemDescription;
};
