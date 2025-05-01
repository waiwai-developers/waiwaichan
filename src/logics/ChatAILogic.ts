import { AppConfig } from "@/src/entities/config/AppConfig";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { ChatAIMessageDto } from "@/src/entities/dto/ChatAIMessageDto";
import { ChatAIContent } from "@/src/entities/vo/ChatAIContent";
import type { ChatAIPrompt } from "@/src/entities/vo/ChatAIPrompt";
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
	async replyTalk(
		prompt: ChatAIPrompt,
		context: Array<ChatAIMessageDto>,
	): Promise<string> {

		//JSONのmetadataは順不同なので整列させる
		const promptData = JSON.parse(
			JSON.stringify(prompt.getValue()),
		);
		const orderPrompt = JSON.stringify({
			persona_role: promptData.persona_role,
			speaking_style_rules: promptData.speaking_style_rules,
			response_directives: promptData.response_directives,
			emotion_model: promptData.emotion_model,
			notes: promptData.notes,
			input_scope: promptData.input_scope,
		});

		const promptInserted = [
			new ChatAIMessageDto(
				ChatAIRole.SYSTEM,
				new ChatAIContent(orderPrompt),
			),
			...context,
		];
		return this.chatAIRepository
			.generate(promptInserted)
			.then((res) => res.getValue());
	}
}
