import { ValueObject } from "./ValueObject";

export class ThreadCategoryType extends ValueObject<number> {
    static CATEGORY_TYPE_CHATGPT = new ThreadCategoryType(0);
}
