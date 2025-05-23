import { AppConfig } from "@/src/entities/config/AppConfig";
import type { ChatAIMessageDto } from "@/src/entities/dto/ChatAIMessageDto";
import { ChatAIContent } from "@/src/entities/vo/ChatAIContent";
import type { IChatAIRepository } from "@/src/logics/Interfaces/repositories/chataiapi/IChatAIRepository";
import { injectable } from "inversify";
import OpenAI from "openai";

@injectable()
export class ChatGPTRepositoryImpl implements IChatAIRepository {
	openai = new OpenAI({ apiKey: AppConfig.openai.openaiApiKey });
	async generate(messages: Array<ChatAIMessageDto>): Promise<ChatAIContent> {
		return this.openai.chat.completions
			.create({
				model: AppConfig.openai.gptModel,
				messages: messages.map(({ role, content }) => {
					return { role: role.getValue(), content: content.getValue() };
				}),
			})
			.then((res) => {
				const content = res.choices[0].message.content
					? res.choices[0].message.content
					: "";
				if (content === "") {
					throw new Error(`failed to create chat ${res}`);
				}
				return new ChatAIContent(content);
			});
	}
}
