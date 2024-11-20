import type { TranslateDto } from "@/entities/dto/TranslateDto";

export interface ITranslatorLogic {
	translate(data: TranslateDto): Promise<string>;
}
