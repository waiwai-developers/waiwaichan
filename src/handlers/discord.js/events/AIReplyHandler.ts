import * as fs from "node:fs";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { MAX_REPLY_CHARACTERS } from "@/src/entities/constants/Discord";
import { ChatAIMessageDto } from "@/src/entities/dto/ChatAIMessageDto";
import { ChatAIContent } from "@/src/entities/vo/ChatAIContent";
import { ChatAIRole } from "@/src/entities/vo/ChatAIRole";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { ThreadGuildId } from "@/src/entities/vo/ThreadGuildId";
import { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { IChatAILogic } from "@/src/logics/Interfaces/logics/IChatAILogic";
import type { IThreadLogic } from "@/src/logics/Interfaces/logics/IThreadLogic";
import { DiscordTextPresenter } from "@/src/presenter/DiscordTextPresenter";
import type { Message } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class AIReplyHandler implements DiscordEventHandler<Message> {
	@inject(LogicTypes.ChatAILogic)
	private readonly chatAILogic!: IChatAILogic;
	@inject(LogicTypes.ThreadLogic)
	private readonly threadLogic!: IThreadLogic;
	async handle(message: Message) {
		if (message.author.bot) return;
		if (!message.channel.isThread()) return;
		if (!(message.channel.ownerId === AppConfig.discord.clientId)) return;
		if (
			(
				await this.threadLogic.find(
					new ThreadGuildId(message.channel.guildId),
					new ThreadMessageId(message.channel.id),
				)
			)?.categoryType.getValue() !==
			ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue()
		)
			return;

		message.channel.sendTyping();

		const chatAIContext = await message.channel.messages
			.fetch({
				limit: 11,
			})
			.then((messages) =>
				messages
					.reverse()
					.map(
						(message) =>
							new ChatAIMessageDto(
								message.author.bot ? ChatAIRole.ASSISTANT : ChatAIRole.USER,
								new ChatAIContent(message.content),
							),
					),
			);

		const results = await this.chatAILogic
			.replyTalk(chatAIContext)
			.then(DiscordTextPresenter);

		await Promise.all(
			results.map(async (t) => {
				await message.reply(t);
			}),
		);
	}
}
