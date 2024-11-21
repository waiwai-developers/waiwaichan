import type { TranslateSourceLanguage } from "@/src/entities/vo/TranslateSourceLanguage";
import type { TranslateTargetLanguage } from "@/src/entities/vo/TranslateTargetLanguage";
import type { TranslateText } from "@/src/entities/vo/TranslateText";

export class TranslateDto {
	constructor(
		public text: TranslateText,
		public source: TranslateSourceLanguage,
		public target: TranslateTargetLanguage,
	) {}
}
