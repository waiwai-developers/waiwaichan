import type { TranslateDto } from "@/entities/dto/TranslateDto";
import type { DiceSides } from "@/entities/vo/DiceSides";
import type { HelpCategory } from "@/entities/vo/HelpCategory";

export interface ITranslatorLogics {
	translate(data: TranslateDto): string;
}
