import type { ChatAIMessageDto } from "@/entities/dto/ChatAIMessageDto";

export interface IChatAILogic {
	createTopic(): string;
	replyTalk(context: Array<ChatAIMessageDto>): string;
}