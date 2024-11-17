import type { ChatAIMessageDto } from "@/entities/dto/ChatAIMessageDto";

export interface IChatAILogics {
	createTopic(): string;
	replyTalk(context: Array<ChatAIMessageDto>): string;
}
