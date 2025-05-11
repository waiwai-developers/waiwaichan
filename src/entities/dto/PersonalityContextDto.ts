import type { PersonalityId } from "@/src/entities/vo/PersonalityId";
import type { PersonalityContextContextId } from "@/src/entities/vo/PersonalityContextContextId";

export class PersonalityContextDto {
	constructor(
		public personalityId: PersonalityId,
		public contextId: PersonalityContextContextId,
	) {}
}
