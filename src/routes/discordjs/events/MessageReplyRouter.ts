import { AppConfig } from "@/src/entities/config/AppConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { ChatAIMessageDto } from "@/src/entities/dto/ChatAIMessageDto";
import { ChatAIContent } from "@/src/entities/vo/ChatAIContent";
import { ChatAIRole } from "@/src/entities/vo/ChatAIRole";
import type { IChatAILogic } from "@/src/logics/Interfaces/logics/IChatAILogic";
import type { DiscordEventRouter } from "@/src/routes/discordjs/events/DiscordEventRouter";
import type { Client, Message } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class MessageReplyRouter implements DiscordEventRouter {
	@inject(LogicTypes.ChatAILogic)
	private chatAILogic!: IChatAILogic;
	register(client: Client): void {
		client.on("messageCreate", async (message: Message) => {
			try {
				if (message.author.bot) return;
				if (!message.channel.isThread()) return;
				if (!(message.channel.ownerId === AppConfig.discord.clientId)) return;

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

				await message.reply(await this.chatAILogic.replyTalk(chatAIContext));
			} catch (e) {
				console.error("Error:", e);
			}
		});
	}
}