import { AppConfig } from "@/src/entities/config/AppConfig";
import { LogicTypes } from "@/src/entities/constants/DIContainerTypes";
import { CommunityDto } from "@/src/entities/dto/CommunityDto";
import { TranslateDto } from "@/src/entities/dto/TranslateDto";
import { CommunityCategoryType } from "@/src/entities/vo/CommunityCategoryType";
import { CommunityClientId } from "@/src/entities/vo/CommunityClientId";
import { MessageClientId } from "@/src/entities/vo/MessageClientId";
import { MessageCommunityId } from "@/src/entities/vo/MessageCommunityId";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";
import { TranslateSourceLanguage } from "@/src/entities/vo/TranslateSourceLanguage";
import { TranslateTargetLanguage } from "@/src/entities/vo/TranslateTargetLanguage";
import { TranslateText } from "@/src/entities/vo/TranslateText";
import type { DiscordEventHandler } from "@/src/handlers/discord.js/events/DiscordEventHandler";
import type { ICommunityLogic } from "@/src/logics/Interfaces/logics/ICommunityLogic";
import type { IMessageLogic } from "@/src/logics/Interfaces/logics/IMessageLogic";
import type { IThreadLogic } from "@/src/logics/Interfaces/logics/IThreadLogic";
import type { ITranslatorLogic } from "@/src/logics/Interfaces/logics/ITranslatorLogic.ts";
import { DiscordTextPresenter } from "@/src/presenter/DiscordTextPresenter";
import type { Message } from "discord.js";
import { inject, injectable } from "inversify";

@injectable()
export class TranslateReplyHandler implements DiscordEventHandler<Message> {
	@inject(LogicTypes.TranslatorLogic)
	private readonly translatorLogic!: ITranslatorLogic;
	@inject(LogicTypes.ThreadLogic)
	private readonly threadLogic!: IThreadLogic;
	@inject(LogicTypes.CommunityLogic)
	private CommunityLogic!: ICommunityLogic;
	@inject(LogicTypes.MessageLogic)
	private MessageLogic!: IMessageLogic;

	async handle(message: Message) {
		if (message.author.bot) return;
		if (!message.channel.isThread()) return;
		if (!(message.channel.ownerId === AppConfig.discord.clientId)) return;

		const guildId = message.channel.guildId;
		if (!guildId) return;

		const communityId = await this.CommunityLogic.getId(
			new CommunityDto(
				CommunityCategoryType.Discord,
				new CommunityClientId(BigInt(guildId)),
			),
		);
		if (communityId == null) return;

		// スレッドのIDは親メッセージのIDと同じなので、clientIdとして使用してMessageIdを取得
		const messageId = await this.MessageLogic.getIdByCommunityIdAndClientId(
			new MessageCommunityId(communityId.getValue()),
			new MessageClientId(BigInt(message.channel.id)),
		);
		if (messageId == null) return;

		const thread = await this.threadLogic.find(
			communityId,
			new ThreadMessageId(messageId.getValue()),
		);

		if (
			thread?.categoryType.getValue() !==
			ThreadCategoryType.CATEGORY_TYPE_DEEPL.getValue()
		)
			return;
		message.channel.sendTyping();

		const replTexts = await this.translatorLogic
			.translate(
				new TranslateDto(
					new TranslateText(message.content),
					new TranslateSourceLanguage(
						JSON.parse(JSON.stringify(thread.metadata)).value.source,
					),
					new TranslateTargetLanguage(
						JSON.parse(JSON.stringify(thread.metadata)).value.target,
					),
				),
			)
			.then(DiscordTextPresenter);
		await Promise.all(
			replTexts.map(async (t) => {
				await message.reply(t);
			}),
		);
	}
}
