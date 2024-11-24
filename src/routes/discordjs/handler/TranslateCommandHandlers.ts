import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { TranslateDto } from "@/src/entities/dto/TranslateDto";
import { TranslateSourceLanguage } from "@/src/entities/vo/TranslateSourceLanguage";
import { TranslateTargetLanguage } from "@/src/entities/vo/TranslateTargetLanguage";
import { TranslateText } from "@/src/entities/vo/TranslateText";
import type { ITranslatorLogic } from "@/src/logics/Interfaces/logics/ITranslatorLogic";
import type { CacheType, ChatInputCommandInteraction } from "discord.js";
import { inject, injectable } from "inversify";
import type { SlashCommandHandler } from "./SlashCommandHandler";

@injectable()
class TranslateCommandHandlers implements SlashCommandHandler {
	@inject(LogicTypes.TranslateLogic)
	private translateLogic!: ITranslatorLogic;

	isHandle(commandName: string): boolean {
		return commandName === "translate";
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		await interaction.deferReply();
		const dto = new TranslateDto(
			new TranslateText(interaction.options?.getString("messages") ?? ""),
			new TranslateSourceLanguage(
				interaction.options?.getString("source") ?? "",
			),
			new TranslateTargetLanguage(
				interaction.options?.getString("target") ?? "",
			),
		);
		await interaction.editReply(await this.translateLogic.translate(dto));
	}
}
