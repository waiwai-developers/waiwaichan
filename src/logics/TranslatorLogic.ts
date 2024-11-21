import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { TranslateDto } from "@/src/entities/dto/TranslateDto";
import { TranslateText } from "@/src/entities/vo/TranslateText";
import type { ITranslatorLogic } from "@/src/logics/Interfaces/logics/ITranslatorLogic";
import type { ITranslatorRepository } from "@/src/logics/Interfaces/repositories/translator/ITranslatorRepository";
import { inject, injectable } from "inversify";

@injectable()
export class TranslatorLogic implements ITranslatorLogic {
	@inject(RepoTypes.TranslateRepository)
	private readonly translatorRepository!: ITranslatorRepository;

	async translate(data: TranslateDto): Promise<string> {
		const { text, source, target } = data;
		if (text.getValue() === "") return "messageパラメーターがないよ！っ";
		if (source.getValue() === "") return "sourceパラメーターがないよ！っ";
		if (target.getValue() === "") return "targetパラメーターがないよ！っ";
		if (source.getValue() === target.getValue())
			return "sourceとtargetが同じだよ！っ";
		const texts = text
			.getValue()
			.split("  ")
			.map((t) => t.trim());

		const postMessages = await Promise.all(
			texts.map(async (text) => {
				const translate = await this.translatorRepository.translate(
					new TranslateDto(new TranslateText(text), source, target),
				);
				return `${translate.getValue()}\n${text}`;
			}),
		);

		if (postMessages.length === 0) return "翻訳できなかったよ！っ";

		return postMessages.join("\n\n");
	}
}
