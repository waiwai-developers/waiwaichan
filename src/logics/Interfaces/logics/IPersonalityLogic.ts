import type { PersonalityDto } from "@/src/entities/dto/PersonalityDto";
import type { PersonalityId } from "@/src/entities/vo/PersonalityId";

export interface IPersonalityLogic {
	find(id: PersonalityId): Promise<PersonalityDto | undefined>;
}
