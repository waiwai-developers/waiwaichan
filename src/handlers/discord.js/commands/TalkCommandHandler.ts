import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { ThreadDto } from "@/src/entities/dto/ThreadDto";
import { PersonalityCategoryId } from "@/src/entities/vo/PersonalityCategoryId";
import { PersonalityCategoryPersonalityId } from "@/src/entities/vo/PersonalityCategoryPersonalityId";
import { PersonalityId } from "@/src/entities/vo/PersonalityId";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { ThreadGuildId } from "@/src/entities/vo/ThreadGuildId";
import { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";
import { ThreadMetadataChatgpt } from "@/src/entities/vo/ThreadMetadataChatgpt";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { IPersonalityCategoryLogic } from "@/src/logics/Interfaces/logics/IPersonalityCategoryLogic";
import type { IPersonalityLogic } from "@/src/logics/Interfaces/logics/IPersonalityLogic";
import type { IThreadLogic } from "@/src/logics/Interfaces/logics/IThreadLogic";
import { metadata } from "@abraham/reflection";
import type {
	CacheType,
	ChatInputCommandInteraction,
	TextChannel,
} from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class TalkCommandHandler implements SlashCommandHandler {
	@inject(LogicTypes.ThreadLogic)
	private readonly threadLogic!: IThreadLogic;
	@inject(LogicTypes.PersonalityLogic)
	private readonly personalityLogic!: IPersonalityLogic;
	@inject(LogicTypes.PersonalityCategoryLogic)
	private readonly personalityCategoryLogic!: IPersonalityCategoryLogic;
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

		const personality = await this.personalityLogic.find(
			PersonalityId.PERSONALITY_ID_WAIWAICHAN,
		);
		if (!personality) {
			return;
		}
		const personalityCategory = await this.personalityCategoryLogic.find(
			new PersonalityCategoryId(interaction.options.getInteger("type", true)),
			new PersonalityCategoryPersonalityId(personality.id.getValue()),
		);
		if (!personalityCategory) {
			return;
		}

		const title = interaction.options.getString("title", true);
		const message = await interaction.reply({
			content: "以下にお話する場を用意したよ！っ",
			fetchReply: true,
		});
		const metadata = Object.assign(
			personality.personality.getValue(),
			personalityCategory.context.getValue(),
		);

		await this.threadLogic.create(
			new ThreadDto(
				new ThreadGuildId(message.guildId),
				new ThreadMessageId(message.id),
				ThreadCategoryType.CATEGORY_TYPE_CHATGPT,
				//ここJSONの型を後で矯正する
				new ThreadMetadataChatgpt(metadata),
			),
		);

		await message.startThread({
			name: `${personalityCategory.name.getValue()}: ${title}`,
			autoArchiveDuration: 60,
		});
	}
}
