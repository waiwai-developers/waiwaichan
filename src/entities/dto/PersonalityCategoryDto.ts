import type { PersonalityCategoryPersonalityId } from "@/src/entities/vo/PersonalityCategoryPersonalityId";
import type { PersonalityCategoryName } from "@/src/entities/vo/PersonalityCategoryName";
import type { PersonalityCategoryContext } from "@/src/entities/vo/PersonalityCategoryContext";

export class PersonalityCategoryDto {
	constructor(
		public personalityId: PersonalityCategoryPersonalityId,
		public name: PersonalityCategoryName,
		public context: PersonalityCategoryContext,
	) {}
}
