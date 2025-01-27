import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { ThreadDto } from "@/src/entities/dto/ThreadDto";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { ThreadGuildId } from "@/src/entities/vo/ThreadGuildId";
import { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";
import { ThreadMetadataDeepl } from "@/src/entities/vo/ThreadMetadataDeepl";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { IThreadLogic } from "@/src/logics/Interfaces/logics/IThreadLogic";
import type {
	CacheType,
	ChatInputCommandInteraction,
	TextChannel,
} from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class TranslateCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.ThreadLogic)
	private readonly threadLogic!: IThreadLogic;
	isHandle(commandName: string): boolean {
		return commandName === "translate";
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
		const source = interaction.options?.getString("source", true);
		const target = interaction.options?.getString("target", true);

		if (source === target) {
			await interaction.reply({
				content: "sourceとtargetが同じだよ！っ",
				fetchReply: true,
			});
			return;
		}

		const message = await interaction.reply({
			content: `以下に${source}から${target}に翻訳する場を用意したよ！っ`,
			fetchReply: true,
		});

		await this.threadLogic.create(
			new ThreadDto(
				new ThreadGuildId(message.guildId),
				new ThreadMessageId(message.id),
				ThreadCategoryType.CATEGORY_TYPE_DEEPL,
				new ThreadMetadataDeepl(
					JSON.parse(`{"source": "${source}", "target": "${target}"}`),
				),
			),
		);

		await message.startThread({
			name: title,
			autoArchiveDuration: 60,
		});
	}
}
