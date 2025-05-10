import type { PersonalityCategoryContext } from "@/src/entities/vo/PersonalityCategoryContext";
import type { PersonalityCategoryName } from "@/src/entities/vo/PersonalityCategoryName";
import type { PersonalityCategoryPersonalityId } from "@/src/entities/vo/PersonalityCategoryPersonalityId";

export class PersonalityCategoryDto {
	constructor(
		public personalityId: PersonalityCategoryPersonalityId,
		public name: PersonalityCategoryName,
		public context: PersonalityCategoryContext,
	) {}
}
