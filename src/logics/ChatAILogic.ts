import { AppConfig } from "@/src/entities/config/AppConfig";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { ChatAIMessageDto } from "@/src/entities/dto/ChatAIMessageDto";
import { ChatAIContent } from "@/src/entities/vo/ChatAIContent";
import { ChatAIRole } from "@/src/entities/vo/ChatAIRole";
import type { IChatAILogic } from "@/src/logics/Interfaces/logics/IChatAILogic";
import type { IChatAIRepository } from "@/src/logics/Interfaces/repositories/chataiapi/IChatAIRepository";
import { inject, injectable } from "inversify";

@injectable()
export class ChatAILogic implements IChatAILogic {
	@inject(RepoTypes.ChatAIRepository)
	private chatAIRepository!: IChatAIRepository;

	createTopic(): Promise<string> {
		throw new Error("Method not implemented.");
	}
	async replyTalk(context: Array<ChatAIMessageDto>): Promise<string> {
		const promptInserted = [
			new ChatAIMessageDto(
				ChatAIRole.SYSTEM,
				new ChatAIContent(AppConfig.openai.gptPrompt),
			),
			...context,
		];
		return this.chatAIRepository
			.generate(promptInserted)
			.then((res) => res.getValue());
	}
}
