import type { ChatAIMessageDto } from "@/src/entities/dto/ChatAIMessageDto";

export interface IChatAILogic {
	createTopic(): Promise<string>;
	replyTalk(context: Array<ChatAIMessageDto>): Promise<string>;
}
