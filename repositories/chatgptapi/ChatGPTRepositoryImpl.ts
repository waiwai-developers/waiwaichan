import config from "@/config.json";
import { AppConfig } from "@/entities/config/AppConfig";
import type { ChatAIMessageDto } from "@/entities/dto/ChatAIMessageDto";
import { ChatAIContent } from "@/entities/vo/ChatAIContent";
import type { IChatAIRepository } from "@/logics/Interfaces/repositories/chataiapi/IChatAIRepository";
import OpenAI from "openai";

export class ChatGPTRepositoryImpl implements IChatAIRepository {
	openai = new OpenAI({ apiKey: AppConfig.openai.openaiApiKey });
	async generate(messages: Array<ChatAIMessageDto>): Promise<ChatAIContent> {
		return this.openai.chat.completions
			.create({
				model: config.openai.gptModel,
				messages: messages.map(({ role, content }) => {
					return { role: role.getValue(), content: content.getValue() };
				}),
			})
			.then((res) => {
				const content = res.choices[0].message.content
					? res.choices[0].message.content
					: "";
				if (content === "") {
					console.error(res);
					throw new Error("failed to create chat");
				}
				return new ChatAIContent(content);
			});
	}
}
