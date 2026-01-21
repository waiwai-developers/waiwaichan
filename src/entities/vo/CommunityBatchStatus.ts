import { ValueObject } from "./ValueObject";

export class CommunityBatchStatus extends ValueObject<number> {
	static Yet = new CommunityBatchStatus(0);
	static Done = new CommunityBatchStatus(1);
}
