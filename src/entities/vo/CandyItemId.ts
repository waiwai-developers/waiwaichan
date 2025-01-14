import { TRADABLE_ITEMS } from "@/src/entities/constants/Items";
import { ValueObject } from "@/src/entities/vo/ValueObject";

export class CandyItemId extends ValueObject<number> {
	validator = (t: number) => TRADABLE_ITEMS.includes(t);
}
