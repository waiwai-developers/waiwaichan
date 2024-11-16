import type { ChatAIContent } from "@/entities/vo/ChatAIContent";
import type { ChatAIRole } from "@/entities/vo/ChatAIRole";

export class ChatAIMessageDto {
	constructor(
		public role: ChatAIRole,
		public content: ChatAIContent,
	) {}
}
