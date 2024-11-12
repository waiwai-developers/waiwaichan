import type { ItemDescription } from "../vo/ItemDescription";
import type { ItemId } from "../vo/ItemId";
import type { ItemName } from "../vo/ItemName";

export type ItemDto = {
	id: ItemId;
	name: ItemName;
	description: ItemDescription;
};
