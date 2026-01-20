import type { PersonalityContextContextId } from "@/src/entities/vo/PersonalityContextContextId";
import type { PersonalityContextPersonalityId } from "@/src/entities/vo/PersonalityContextPersonalityId";

export class PersonalityContextDto {
	constructor(
		public personalityId: PersonalityContextPersonalityId,
		public contextId: PersonalityContextContextId,
	) {}
}
