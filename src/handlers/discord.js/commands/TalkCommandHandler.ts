import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { ThreadDto } from "@/src/entities/dto/ThreadDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { ContextId } from "@/src/entities/vo/ContextId";
import { PersonalityContextContextId } from "@/src/entities/vo/PersonalityContextContextId";
import { PersonalityContextPersonalityId } from "@/src/entities/vo/PersonalityContextPersonalityId";
import { PersonalityId } from "@/src/entities/vo/PersonalityId";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";
import { ThreadMetadataChatgpt } from "@/src/entities/vo/ThreadMetadataChatgpt";
import type { SlashCommandHandler } from "@/src/handlers/discord.js/commands/SlashCommandHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IContextLogic } from "@/src/logics/Interfaces/logics/IContextLogic";
import type { IPersonalityContextLogic } from "@/src/logics/Interfaces/logics/IPersonalityContextLogic";
import type { IPersonalityLogic } from "@/src/logics/Interfaces/logics/IPersonalityLogic";
import type { IThreadLogic } from "@/src/logics/Interfaces/logics/IThreadLogic";
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
	@inject(LogicTypes.ContextLogic)
	private readonly contextLogic!: IContextLogic;
	@inject(LogicTypes.PersonalityContextLogic)
	private readonly personalityContextLogic!: IPersonalityContextLogic;
	@inject(LogicTypes.CommunityLogic)
	private CommunityLogic!: ICommunityLogic;

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
		if (!interaction.guildId) {
			return;
		}
		const communityId = await this.CommunityLogic.getId(
			new CommunityDto(
				CommunityCategoryType.Discord,
				new CommunityClientId(BigInt(interaction.guildId)),
			),
		);
		if (communityId == null) {
			return;
		}

		const personality = await this.personalityLogic.find(
			PersonalityId.PERSONALITY_ID_WAIWAICHAN,
		);
		if (!personality) {
			return;
		}

		const personalityContext = await this.personalityContextLogic.find(
			new PersonalityContextPersonalityId(personality.id.getValue()),
			new PersonalityContextContextId(
				interaction.options.getInteger("type", true),
			),
		);
		if (!personalityContext) {
			return;
		}

		const context = await this.contextLogic.find(
			new ContextId(personalityContext.contextId.getValue()),
		);
		if (!context) {
			return;
		}

		const title = interaction.options.getString("title", true);
		const message = await interaction.reply({
			content: "以下にお話する場を用意したよ！っ",
			fetchReply: true,
		});
		const metadata = {
			...personality.prompt.getValue(),
			...context.prompt.getValue(),
		};

		await this.threadLogic.create(
			new ThreadDto(
				communityId,
				new ThreadMessageId(message.id),
				ThreadCategoryType.CATEGORY_TYPE_CHATGPT,
				new ThreadMetadataChatgpt(metadata),
			),
		);

		await message.startThread({
			name: `${context.name.getValue()}: ${title}`,
			autoArchiveDuration: 60,
		});
	}
}
