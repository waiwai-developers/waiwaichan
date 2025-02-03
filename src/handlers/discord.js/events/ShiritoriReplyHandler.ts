import { AppConfig } from "@/src/entities/config/AppConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { ShiritoriWordDto } from "@/src/entities/dto/ShiritoriWordDto";

import { ShiritoriWordGuildId } from "@/src/entities/vo/ShiritoriWordGuildId";
import { ShiritoriWordMessageId } from "@/src/entities/vo/ShiritoriWordMessageId";
import { ShiritoriWordNextMessageId } from "@/src/entities/vo/ShiritoriWordNextMessageId";
import { ShiritoriWordReadingWord } from "@/src/entities/vo/ShiritoriWordReadingWord";
import { ShiritoriWordThreadId } from "@/src/entities/vo/ShiritoriWordThreadId";
import { ShiritoriWordUserId } from "@/src/entities/vo/ShiritoriWordUserId";
import { ShiritoriWordWritingWord } from "@/src/entities/vo/ShiritoriWordWritingWord";

import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { ThreadGuildId } from "@/src/entities/vo/ThreadGuildId";
import { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";

import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { IShiritoriLogic } from "@/src/logics/Interfaces/logics/IShiritoriLogic.ts";
import type { IThreadLogic } from "@/src/logics/Interfaces/logics/IThreadLogic";
import type { Message } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class ShiritoriReplyHandler implements DiscordEventHandler<Message> {
	@inject(LogicTypes.TranslatorLogic)
	private readonly shiritoriLogic!: IShiritoriLogic;
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
				ThreadCategoryType.CATEGORY_TYPE_SHIRITORI.getValue()
			)
				return;

			message.channel.sendTyping();
			message.reply(
				await this.shiritoriLogic.createWord(
					new ShiritoriWordDto(
						new ShiritoriWordUserId(),
						new ShiritoriWordGuildId(),
						new ShiritoriWordThreadId(),
						new ShiritoriWordMessageId(),
						new ShiritoriWordReadingWord(),
						new ShiritoriWordWritingWord(),
						new ShiritoriWordNextMessageId(),
					),
				),
			);
		} catch (e) {
			console.error("Error:", e);
		}
	}
}
