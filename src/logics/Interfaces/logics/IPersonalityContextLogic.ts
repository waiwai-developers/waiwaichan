import type { PersonalityContextDto } from "@/src/entities/dto/PersonalityContextDto";
import type { PersonalityContextContextId } from "@/src/entities/vo/PersonalityContextContextId";
import type { PersonalityContextPersonalityId } from "@/src/entities/vo/PersonalityContextPersonalityId";

export interface IPersonalityContextLogic {
	find(
		personalityId: PersonalityContextPersonalityId,
		contextid: PersonalityContextContextId,
	): Promise<PersonalityContextDto | undefined>;
}
