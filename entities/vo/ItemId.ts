import { TRADABLE_ITEMS } from "../Items";
import { ValueObject } from "./ValueObject";

export class ItemId extends ValueObject<number> {
	validator = (t: number) => TRADABLE_ITEMS.includes(t);
}
