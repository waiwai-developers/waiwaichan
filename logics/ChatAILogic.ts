import type { ChatAIMessageDto } from "@/entities/dto/ChatAIMessageDto";
import type { IChatAILogic } from "@/logics/Interfaces/logics/IChatAILogic";
import type { IChatAIRepository } from "@/logics/Interfaces/repositories/chataiapi/IChatAIRepository";

export class ChatAILogic implements IChatAILogic {
	constructor(private readonly chatAIRepository: IChatAIRepository) {}

	createTopic(): Promise<string> {
		throw new Error("Method not implemented.");
	}
	replyTalk(context: Array<ChatAIMessageDto>): Promise<string> {
		throw new Error("Method not implemented.");
	}
}
