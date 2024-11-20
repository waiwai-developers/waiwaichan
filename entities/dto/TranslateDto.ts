import type { TranslateSourceLanguage } from "@/entities/vo/TranslateSourceLanguage";
import type { TranslateTargetLanguage } from "@/entities/vo/TranslateTargetLanguage";
import type { TranslateText } from "@/entities/vo/TranslateText";

export class TranslateDto {
	constructor(
		public text: TranslateText,
		public source: TranslateSourceLanguage,
		public target: TranslateTargetLanguage,
	) {}
}
