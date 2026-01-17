import type { DiceContextDto } from "@/src/entities/dto/DiceContextDto";
import type { DiceResultDto } from "@/src/entities/dto/DiceResultDto";

export interface IDiceLogic {
	dice(ctx: DiceContextDto): Promise<DiceResultDto>;
}
