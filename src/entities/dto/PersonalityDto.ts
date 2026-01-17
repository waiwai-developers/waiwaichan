import type { PersonalityId } from "@/src/entities/vo/PersonalityId";
import type { PersonalityName } from "@/src/entities/vo/PersonalityName";
import type { PersonalityPrompt } from "@/src/entities/vo/PersonalityPrompt";

export class PersonalityDto {
	constructor(
		public id: PersonalityId,
		public name: PersonalityName,
		public prompt: PersonalityPrompt,
	) {}
}
