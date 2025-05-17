import type { PersonalityContextDto } from "@/src/entities/dto/PersonalityContextDto";
import type { PersonalityContextContextId } from "@/src/entities/vo/PersonalityContextContextId";
import type { PersonalityContextPersonalityId } from "@/src/entities/vo/PersonalityContextPersonalityId";

export interface IPersonalityContextRepository {
	findBypersonalityIdAndcontextId(
		personalityId: PersonalityContextPersonalityId,
		contextId: PersonalityContextContextId,
	): Promise<PersonalityContextDto | undefined>;
}
