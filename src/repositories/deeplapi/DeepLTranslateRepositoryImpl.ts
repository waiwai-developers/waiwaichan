import { AppConfig } from "@/src/entities/config/AppConfig";
import type { TranslateDto } from "@/src/entities/dto/TranslateDto";
import { TranslateText } from "@/src/entities/vo/TranslateText";
import type { ITranslatorRepository } from "@/src/logics/Interfaces/repositories/translator/ITranslatorRepository";
import {
	type SourceLanguageCode,
	type TargetLanguageCode,
	Translator,
} from "deepl-node";
import { injectable } from "inversify";

@injectable()
export class DeepLTranslateRepositoryImpl implements ITranslatorRepository {
	translator: Translator;
	constructor() {
		this.translator = new Translator(AppConfig.deepl.deeplApiKey);
	}
	async translate(text: TranslateDto): Promise<TranslateText> {
		return this.translator
			.translateText(
				text.text.getValue(),
				text.source.getValue() as SourceLanguageCode,
				text.target.getValue() as TargetLanguageCode,
			)
			.then((r) => new TranslateText(r.text));
	}
}
