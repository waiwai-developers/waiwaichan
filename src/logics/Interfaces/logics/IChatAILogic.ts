import type { ChatAIMessageDto } from "@/src/entities/dto/ChatAIMessageDto";
import type { ChatAIPrompt } from "@/src/entities/vo/ChatAIPrompt";

export interface IChatAILogic {
	createTopic(): Promise<string>;
	replyTalk(
		prompt: ChatAIPrompt,
		context: Array<ChatAIMessageDto>,
	): Promise<string>;
}
