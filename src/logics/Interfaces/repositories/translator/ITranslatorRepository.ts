import type { TranslateDto } from "@/src/entities/dto/TranslateDto";
import type { TranslateText } from "@/src/entities/vo/TranslateText";

export interface ITranslatorRepository {
	translate(text: TranslateDto): Promise<TranslateText>;
}
