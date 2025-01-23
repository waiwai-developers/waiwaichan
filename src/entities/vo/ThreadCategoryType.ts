import { ValueObject } from "./ValueObject";

export class ThreadCategoryType extends ValueObject<number> {
	static CATEGORY_TYPE_CHATGPT = new ThreadCategoryType(0);
	static CATEGORY_TYPE_DEEPL = new ThreadCategoryType(1);
	static CATEGORY_TYPE_GITHUB = new ThreadCategoryType(2);
}
