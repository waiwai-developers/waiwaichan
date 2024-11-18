import type { TranslateDto } from "@/entities/dto/TranslateDto";
import type { ITranslatorLogic } from "@/logics/Interfaces/logics/ITranslatorLogic";
import type { ITranslatorRepository } from "@/logics/Interfaces/repositories/translator/ITranslatorRepository";

export class TranslatorLogic implements ITranslatorLogic {
	constructor(private readonly translatorRepository: ITranslatorRepository) {}

	translate(data: TranslateDto): Promise<string> {
		throw new Error("Method not implemented.");
	}
}
