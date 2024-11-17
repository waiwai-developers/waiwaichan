import type { ChatAIMessageDto } from "@/entities/dto/ChatAIMessageDto";

interface IChatAILogics {
	createTopic(): string;
	replyTalk(context: Array<ChatAIMessageDto>): string;
}
