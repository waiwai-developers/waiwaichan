import { TRADABLE_ITEMS } from "../constants/Items";
import { ValueObject } from "./ValueObject";

export class PointItemId extends ValueObject<number> {
	validator = (t: number) => TRADABLE_ITEMS.includes(t);
}