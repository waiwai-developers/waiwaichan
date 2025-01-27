import { ValueObject } from "./ValueObject";

export class ThreadMetadataGithub extends ValueObject<JSON> {
	validator = (value: JSON) => {
		return value === JSON.parse("{}");
	};
}
