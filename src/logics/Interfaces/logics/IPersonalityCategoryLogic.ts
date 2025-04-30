import type { PersonalityCategoryDto } from "@/src/entities/dto/PersonalityCategoryDto";
import type { PersonalityCategoryId } from "@/src/entities/vo/PersonalityCategoryId";
import type { PersonalityCategoryPersonalityId } from "@/src/entities/vo/PersonalityCategoryPersonalityId";

export interface IPersonalityCategoryLogic {
	find(
		id: PersonalityCategoryId,
		PersonalityId: PersonalityCategoryPersonalityId,
	): Promise<PersonalityCategoryDto | undefined>;
}
