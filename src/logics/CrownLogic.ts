import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import { CrownDto } from "@/src/entities/dto/CrownDto";
import type { CrownMessage } from "@/src/entities/vo/CrownMessage";
import type { CrownMessageLink } from "@/src/entities/vo/CrownMessageLink";
import type { MessageId } from "@/src/entities/vo/MessageId";
import type { ICrownLogic } from "@/src/logics/Interfaces/logics/ICrownLogic";
import type { ICrownRepository } from "@/src/logics/Interfaces/repositories/database/ICrownRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
import type { IMutex } from "@/src/logics/Interfaces/repositories/mutex/IMutex";
import { inject, injectable } from "inversify";
import type { CommunityId } from "../entities/vo/CommunityId";

@injectable()
export class CrownLogic implements ICrownLogic {
	@inject(RepoTypes.CrownRepository)
	private readonly crownRepository!: ICrownRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction;

	@inject(RepoTypes.Mutex)
	private readonly mutex!: IMutex;

	async createCrownIfNotExists(
		communityId: CommunityId,
		messageId: MessageId,
		crownMessage: CrownMessage,
		crownMessageLink: CrownMessageLink,
	): Promise<string | undefined> {
		return await this.find(new CrownDto(communityId, messageId)).then((c) => {
			if (c != null) {
				return undefined;
			}
			return this.create(
				communityId,
				messageId,
				crownMessage,
				crownMessageLink,
			);
		});
	}

	private async find(data: CrownDto): Promise<CrownDto | undefined> {
		return this.transaction.startTransaction(async () => {
			return await this.crownRepository.findOne(data);
		});
	}

	private async create(
		communityId: CommunityId,
		messageId: MessageId,
		crownMessage: CrownMessage,
		crownMessageLink: CrownMessageLink,
	): Promise<string> {
		return this.transaction
			.startTransaction(async () => {
				return await this.crownRepository
					.create(new CrownDto(communityId, messageId))
					.then((res) => {
						if (!res) {
							throw new Error("crown registration failed");
						}
						return `が殿堂入り 👑 したよ！っ\n- 投稿内容\n  - メッセージ: ${crownMessage.getValue()}\n  - リンク: ${crownMessageLink.getValue()}`;
					});
			})
			.catch((_err) => "にクラウンを登録出来なかったよ！っ");
	}
}
