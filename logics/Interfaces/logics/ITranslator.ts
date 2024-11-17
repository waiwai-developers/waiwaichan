import type { TranslateDto } from "@/entities/dto/TranslateDto";
import type { DiceSides } from "@/entities/vo/DiceSides";
import type { HelpCategory } from "@/entities/vo/HelpCategory";

interface ITranslatorLogics {
	translate(data: TranslateDto): string;
}
