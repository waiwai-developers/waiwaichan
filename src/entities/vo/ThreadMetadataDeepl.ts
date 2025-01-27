import { ValueObject } from "./ValueObject";

export class ThreadMetadataDeepl extends ValueObject<JSON> {
	validator = (value: JSON) => {
		const metadata = JSON.parse(JSON.stringify(value));
		return metadata?.source && metadata?.target;
	};
}
