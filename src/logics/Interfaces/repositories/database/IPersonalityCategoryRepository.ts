import type { PersonalityCategoryDto } from "@/src/entities/dto/PersonalityCategoryDto";
import type { PersonalityCategoryId } from "@/src/entities/vo/PersonalityCategoryId";
import type { PersonalityCategoryPersonalityId } from "@/src/entities/vo/PersonalityCategoryPersonalityId";

export interface IPersonalityCategoryRepository {
	findByIdAndPersonalityId(
		id: PersonalityCategoryId,
		personalityId: PersonalityCategoryPersonalityId,
	): Promise<PersonalityCategoryDto | undefined>;
}
