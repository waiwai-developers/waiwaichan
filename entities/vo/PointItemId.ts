import { TRADABLE_ITEMS } from "@/entities/constants/Items";
import { ValueObject } from "@/entities/vo/ValueObject";

export class PointItemId extends ValueObject<number> {
	validator = (t: number) => TRADABLE_ITEMS.includes(t);
}
