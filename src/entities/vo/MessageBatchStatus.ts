import { ValueObject } from "./ValueObject";

export class MessageBatchStatus extends ValueObject<number> {
	static Yet = new MessageBatchStatus(0);
	static Done = new MessageBatchStatus(1);
}
