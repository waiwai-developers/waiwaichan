import type { ContextName } from "@/src/entities/vo/ContextName";
import type { ContextPrompt } from "@/src/entities/vo/ContextPrompt";

export class ContextDto {
	constructor(
		public name: ContextName,
		public context: ContextPrompt,
	) {}
}
