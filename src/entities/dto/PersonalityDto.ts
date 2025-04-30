import type { PersonalityId } from "@/src/entities/vo/PersonalityId";
import type { PersonalityName } from "@/src/entities/vo/PersonalityName";
import type { PersonalityPersonality } from "@/src/entities/vo/PersonalityPersonality";

export class PersonalityDto {
	constructor(
		public id: PersonalityId,
		public name: PersonalityName,
		public personality: PersonalityPersonality,
	) {}
}
