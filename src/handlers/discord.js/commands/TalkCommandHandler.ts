import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type {
	CacheType,
	ChatInputCommandInteraction,
	TextChannel,
} from "discord.js";
import { inject, injectable } from "inversify";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import type { IThreadLogic } from "@/src/logics/Interfaces/logics/IThreadLogic";
import { ThreadDto } from "@/src/entities/dto/ThreadDto";
import { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";

@injectable()
export class TalkCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.ThreadLogic)
	private readonly threadLogic!: IThreadLogic;
	isHandle(commandName: string): boolean {
		return commandName === "talk";
	}

	isTextChannel(channel: unknown): channel is TextChannel {
		return (
			(channel as TextChannel).threads != null &&
			(channel as TextChannel).threads.create != null
		);
	}

	async handle(
		interaction: ChatInputCommandInteraction<CacheType>,
	): Promise<void> {
		if (interaction.channel == null) {
			return;
		}
		if (!this.isTextChannel(interaction.channel)) {
			return;
		}

		const title = interaction.options.getString("title", true);

		const message = await interaction
			.reply({
				content: "以下にお話する場を用意したよ！っ",
				fetchReply: true,
			})

		await this.threadLogic.create(
			new ThreadDto(
				new ThreadMessageId(message.id),
				ThreadCategoryType.CATEGORY_TYPE_CHATGPT
			)
		);

		await message.startThread({
				name: title,
				autoArchiveDuration: 60,
		});
	}
}
