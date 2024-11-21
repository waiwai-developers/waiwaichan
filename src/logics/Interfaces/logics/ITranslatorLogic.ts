import type { TranslateDto } from "@/src/entities/dto/TranslateDto";

export interface ITranslatorLogic {
	translate(data: TranslateDto): Promise<string>;
}
