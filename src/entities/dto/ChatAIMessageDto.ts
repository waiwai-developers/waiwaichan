import type { ChatAIContent } from "@/src/entities/vo/ChatAIContent";
import type { ChatAIRole } from "@/src/entities/vo/ChatAIRole";
export class ChatAIMessageDto {
	constructor(
		public role: ChatAIRole,
		public content: ChatAIContent,
	) {}
}
