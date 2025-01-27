import { AppConfig } from "@/src/entities/config/AppConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { TranslateDto } from "@/src/entities/dto/TranslateDto";

import { TranslateSourceLanguage } from "@/src/entities/vo/TranslateSourceLanguage";
import { TranslateTargetLanguage } from "@/src/entities/vo/TranslateTargetLanguage";
import { TranslateText } from "@/src/entities/vo/TranslateText";

import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { ThreadGuildId } from "@/src/entities/vo/ThreadGuildId";
import { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";

import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { IThreadLogic } from "@/src/logics/Interfaces/logics/IThreadLogic";
import type { ITranslatorLogic } from "@/src/logics/Interfaces/logics/ITranslatorLogic.ts";
import type { Message } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class TranslateReplyHandler implements DiscordEventHandler<Message> {
	@inject(LogicTypes.TranslatorLogic)
	private readonly translatorLogic!: ITranslatorLogic;
	@inject(LogicTypes.ThreadLogic)
	private readonly threadLogic!: IThreadLogic;
	async handle(message: Message) {
		try {
			if (message.author.bot) return;
			if (!message.channel.isThread()) return;
			if (!(message.channel.ownerId === AppConfig.discord.clientId)) return;

			const thread = await this.threadLogic.find(
				new ThreadGuildId(message.channel.guildId),
				new ThreadMessageId(message.channel.id),
			);

			if (
				thread?.categoryType.getValue() !==
				ThreadCategoryType.CATEGORY_TYPE_DEEPL.getValue()
			)
				return;

			message.channel.sendTyping();
			message.reply(
				await this.translatorLogic.translate(
					new TranslateDto(
						new TranslateText(message.content),
						new TranslateSourceLanguage(
							JSON.parse(JSON.stringify(thread.metadata)).value.source,
						),
						new TranslateTargetLanguage(
							JSON.parse(JSON.stringify(thread.metadata)).value.target,
						),
					),
				),
			);
		} catch (e) {
			console.error("Error:", e);
		}
	}
}
