import type { ChatAIMessageDto } from "@/entities/dto/ChatAIMessageDto";

export interface IChatAILogic {
	createTopic(): Promise<string>;
	replyTalk(context: Array<ChatAIMessageDto>): Promise<string>;
}
