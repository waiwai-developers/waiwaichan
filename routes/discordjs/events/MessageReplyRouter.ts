import config from "@/config.json";
import { ChatAIMessageDto } from "@/entities/dto/ChatAIMessageDto";
import { ChatAIContent } from "@/entities/vo/ChatAIContent";
import { ChatAIRole } from "@/entities/vo/ChatAIRole";
import type { IChatAILogic } from "@/logics/Interfaces/logics/IChatAILogic";
import type { DiscordEventRouter } from "@/routes/discordjs/events/DiscordEventRouter";
import type { Client, Message } from "discord.js";

export class MessageReplyRouter implements DiscordEventRouter {
	constructor(private chatAILogic: IChatAILogic) {}
	register(client: Client): void {
		client.on("messageCreate", async (message: Message) => {
			try {
				if (message.author.bot) return;
				if (!message.channel.isThread()) return;
				if (!(message.channel.ownerId === config.discord.clientId)) return;

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