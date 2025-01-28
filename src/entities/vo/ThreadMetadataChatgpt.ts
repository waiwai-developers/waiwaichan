import { ValueObject } from "./ValueObject";

export class ThreadMetadataChatgpt extends ValueObject<JSON> {
	validator = (value: JSON) => {
		return value === JSON.parse("{}");
	};
}
