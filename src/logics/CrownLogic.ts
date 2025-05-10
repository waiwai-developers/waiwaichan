import { AppConfig } from "@/src/entities/config/AppConfig";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { CrownDto } from "@/src/entities/dto/CrownDto";
import type { CrownMessage } from "@/src/entities/vo/CrownMessage";
import type { CrownMessageLink } from "@/src/entities/vo/CrownMessageLink";
import type { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { ICrownLogic } from "@/src/logics/Interfaces/logics/ICrownLogic";
import type { ICrownRepository } from "@/src/logics/Interfaces/repositories/database/ICrownRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import type { IMutex } from "@/src/logics/Interfaces/repositories/mutex/IMutex";
import { inject, injectable } from "inversify";

@injectable()
export class CrownLogic implements ICrownLogic {
	@inject(RepoTypes.CrownRepository)
	private readonly crownRepository!: ICrownRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	@inject(RepoTypes.Mutex)
	private readonly mutex!: IMutex;

	async find(data: CrownDto): Promise<CrownDto | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.crownRepository.findOne(data);
		});
	}

	async create(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
		messageId: DiscordMessageId,
		crownMessage: CrownMessage,
		crownMessageLink: CrownMessageLink,
	): Promise<string> {
		return this.transaction
			.startTransaction(async () => {
				return await this.crownRepository
					.create(new CrownDto(guildId, messageId))
					.then((res) => {
						if (!res) {
							throw new Error("crown registration failed");
						}
						return `<@${userId.getValue()}>さんが殿堂入り ${AppConfig.backend.crownEmoji} したよ！っ\n- 投稿内容\n  - メッセージ: ${crownMessage.getValue()}\n  - リンク: ${crownMessageLink.getValue()}`;
					});
			})
			.catch((_err) => "クラウンを登録出来なかったよ！っ");
	}
}
