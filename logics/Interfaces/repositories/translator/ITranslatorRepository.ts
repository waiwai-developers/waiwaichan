import type { TranslateDto } from "@/entities/dto/TranslateDto";
import type { TranslateText } from "@/entities/vo/TranslateText";

export interface ITextItemRepository {
	translate(text: TranslateDto): Promise<TranslateText>;
}
