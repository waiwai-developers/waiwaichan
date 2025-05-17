import type { ContextDto } from "@/src/entities/dto/ContextDto";
import type { ContextId } from "@/src/entities/vo/ContextId";

export interface IContextRepository {
	findById(id: ContextId): Promise<ContextDto | undefined>;
}
