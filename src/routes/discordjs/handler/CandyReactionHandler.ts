import type { IPointLogic } from "@/src//logics/Interfaces/logics/IPointLogic";
import { AppConfig } from "@/src/entities/config/AppConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { IChatAILogic } from "@/src/logics/Interfaces/logics/IChatAILogic";
import { inject, injectable } from "inversify";
import type {
	DiscordEventHandler,
	ReactionInteraction,
} from "./DiscordEventHandler";

@injectable()
export class AIReplyHandler
	implements DiscordEventHandler<ReactionInteraction>
{
	@inject(LogicTypes.PointLogic)
	private pointLogic!: IPointLogic;

	async handle({ reaction, user }: ReactionInteraction): Promise<void> {
		if (reaction.partial) {
			try {
				await reaction.fetch();
				await reaction.message.fetch();
			} catch (err) {
				console.log("fail to fetch old message");
				return;
			}
		}
		if (user.bot) {
			console.log("reaction by bot");
			return;
		}

		if (
			(reaction.message.author?.bot ?? true) ||
			(reaction.message.author?.id ?? null) == null
		) {
			console.log("some data is null");
			return;
		}

		if (reaction.message.author?.id == null) {
			console.log("author id is null");
			return;
		}

		if (reaction.emoji.name !== AppConfig.backend.pointEmoji) {
			console.log("not peer bonus emoji");
			return;
		}

		const res = await this.pointLogic.givePoint(
			new DiscordUserId(reaction.message.author.id),
			new DiscordUserId(user.id),
			new DiscordMessageId(reaction.message.id),
		);

		if (!res) {
			return;
		}
		await reaction.message.reply(res);
	}
	@inject(LogicTypes.ChatAILogic)
	private chatAILogic!: IChatAILogic;
}
