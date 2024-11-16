import type {ChatAIRole} from "@/entities/vo/ChatAIRole";
import type {ChatAIContent} from "@/entities/vo/ChatAIContent";

export class ChatAIMessageDto {
    constructor( public role: ChatAIRole, public content: ChatAIContent) {}
}