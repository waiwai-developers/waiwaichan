import { ValueObject } from "./ValueObject";

export class CandyCategoryType extends ValueObject<number> {
	static CATEGORY_TYPE_NORMAL = new CandyCategoryType(0);
	static CATEGORY_TYPE_SUPER = new CandyCategoryType(1);
}
