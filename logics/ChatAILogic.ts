import { AppConfig } from "@/entities/config/AppConfig";
import { ChatAIMessageDto } from "@/entities/dto/ChatAIMessageDto";
import { ChatAIContent } from "@/entities/vo/ChatAIContent";
import { ChatAIRole } from "@/entities/vo/ChatAIRole";
import type { IChatAILogic } from "@/logics/Interfaces/logics/IChatAILogic";
import type { IChatAIRepository } from "@/logics/Interfaces/repositories/chataiapi/IChatAIRepository";
import { injectable } from "inversify";

@injectable()
export class ChatAILogic implements IChatAILogic {
	constructor(private readonly chatAIRepository: IChatAIRepository) {}

	createTopic(): Promise<string> {
		throw new Error("Method not implemented.");
	}
	async replyTalk(context: Array<ChatAIMessageDto>): Promise<string> {
		const promptInserted = [
			new ChatAIMessageDto(
				ChatAIRole.SYSTEM,
				new ChatAIContent(AppConfig.openai.gptPrompt),
			),
			...context,
		];
		return this.chatAIRepository
			.generate(promptInserted)
			.then((res) => res.getValue());
	}
}
