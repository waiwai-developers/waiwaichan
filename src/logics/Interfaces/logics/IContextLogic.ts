import type { ContextDto } from "@/src/entities/dto/ContextDto";
import type { PersonalityContextContextId } from "@/src/entities/vo/PersonalityContextContextId";
import type { PersonalityContextPersonalityId } from "@/src/entities/vo/PersonalityContextPersonalityId";

export interface IContextLogic {
	find(id: PersonalityContextContextId): Promise<ContextDto | undefined>;
}
