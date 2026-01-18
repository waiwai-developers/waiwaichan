import { AppConfig } from "@/src/entities/config/AppConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { Thread_Fetch_Nom, Thread_Exclude_Prefix } from "@/src/entities/constants/Thread";
import { ChatAIMessageDto } from "@/src/entities/dto/ChatAIMessageDto";
import { ChatAIContent } from "@/src/entities/vo/ChatAIContent";
import { ChatAIPrompt } from "@/src/entities/vo/ChatAIPrompt";
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
		if(message.content.charAt(0) === Thread_Exclude_Prefix) return;

		const thread = await this.threadLogic.find(
			new ThreadGuildId(message.channel.guildId),
			new ThreadMessageId(message.channel.id),
		);
		if (
			thread?.categoryType.getValue() !==
			ThreadCategoryType.CATEGORY_TYPE_CHATGPT.getValue()
		)
			return;

		message.channel.sendTyping();

		const chatAIContext = await message.channel.messages
			.fetch({
				limit: Thread_Fetch_Nom,
			})
			.then((messages) =>
				messages
					.filter((message)=> message.content.charAt(0) !== Thread_Exclude_Prefix )
					.map(
						(message) =>
							new ChatAIMessageDto(
								message.author.bot ? ChatAIRole.ASSISTANT : ChatAIRole.USER,
								new ChatAIContent(message.content),
							),
					)
					.reverse(),
					
			);

		try {
			const results = await this.chatAILogic
				.replyTalk(new ChatAIPrompt(thread.metadata.getValue()), chatAIContext)
				.then(DiscordTextPresenter);

			await Promise.all(
				results.map(async (t) => {
					try {
						await message.reply(t);
					} catch (error) {
						// メッセージ送信エラーを捕捉して処理を続行
						console.error("メッセージ送信エラー:", error);
					}
				}),
			);
		} catch (error) {
			// ChatAI応答生成エラーを捕捉して処理を続行
			console.error("ChatAI応答生成エラー:", error);
			try {
				await message.reply(
					"ごめんね！っ、応答の生成中にエラーが発生したよ！！っ。",
				);
			} catch (replyError) {
				// エラーメッセージの送信に失敗した場合も処理を続行
				console.error("エラーメッセージ送信エラー:", replyError);
			}
		}
	}
}
