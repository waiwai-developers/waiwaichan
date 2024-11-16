import type {ChatAIMessageDto} from "@/entities/dto/ChatAIMessageDto";
import type {ChatAIContent} from "@/entities/vo/ChatAIContent";

export interface IChatAIRepository{
    generate(messages: Array<ChatAIMessageDto>): Promise<ChatAIContent>
}