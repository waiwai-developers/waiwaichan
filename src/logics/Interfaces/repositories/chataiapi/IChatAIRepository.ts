import type { ChatAIMessageDto } from "@/src/entities/dto/ChatAIMessageDto";
import type { ChatAIContent } from "@/src/entities/vo/ChatAIContent";

export interface IChatAIRepository {
	generate(messages: Array<ChatAIMessageDto>): Promise<ChatAIContent>;
}
