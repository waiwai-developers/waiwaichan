import { AppConfig } from "@/src/entities/config/AppConfig";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import {
	ID_HIT,
	ID_JACKPOT,
	PROBABILITY_HIT,
	PROBABILITY_JACKPOT,
} from "@/src/entities/constants/Items";
import { CandyDto } from "@/src/entities/dto/CandyDto";
import { UserCandyItemDto } from "@/src/entities/dto/UserCandyItemDto";
import { CandyExpire } from "@/src/entities/vo/CandyExpire";
import { CandyItemId } from "@/src/entities/vo/CandyItemId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordMessageLink } from "@/src/entities/vo/DiscordMessageLink";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { UserCandyItemExpire } from "@/src/entities/vo/UserCandyItemExpire";
import { UserCandyItemId } from "@/src/entities/vo/UserCandyItemId";
import type { ICandyLogic } from "@/src/logics/Interfaces/logics/ICandyLogic";
import type { ICandyItemRepository } from "@/src/logics/Interfaces/repositories/database/ICandyItemRepository";
import type { ICandyRepository } from "@/src/logics/Interfaces/repositories/database/ICandyRepository";
import type { IUserCandyItemRepository } from "@/src/logics/Interfaces/repositories/database/IUserCandyItemRepository";
import type { IMutex } from "@/src/logics/Interfaces/repositories/mutex/IMutex";
import dayjs from "dayjs";
import { inject, injectable } from "inversify";

@injectable()
export class CandyLogic implements ICandyLogic {
	@inject(RepoTypes.CandyRepository)
	private readonly candyRepository!: ICandyRepository;

	@inject(RepoTypes.CandyItemRepository)
	private readonly candyItemRepository!: ICandyItemRepository;

	@inject(RepoTypes.UserCandyItemRepository)
	private readonly userCandyItemRepository!: IUserCandyItemRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction<TransactionLike>;

	@inject(RepoTypes.Mutex)
	private readonly mutex!: IMutex;

	async check(userId: DiscordUserId): Promise<string> {
		const candyCount = await this.candyRepository
			.candyCount(userId)
			.then((candyCount) => candyCount.getValue());

		if (candyCount <= 0) {
			return "キャンディがないよ！っ";
		}

		const candyExpire = await this.candyRepository
			.candyExpire(userId)
			.then((e) =>
				e
					? dayjs(e.getValue()).subtract(1, "d").format("YYYY/MM/DD")
					: undefined,
			);

		if (!candyExpire) {
			return "キャンディがないよ！っ";
		}

		return `キャンディが${candyCount}個あるよ！期限が${candyExpire}に切れるから気を付けてね！っ`;
	}

	async exchange(
		userId: DiscordUserId,
		userCandyItemId: UserCandyItemId,
	): Promise<string> {
		return this.transaction
			.startTransaction(async (t) => {
				return this.userCandyItemRepository
					.exchangeById(userCandyItemId, userId)
					.then(async (updated) => {
						if (!updated) {
							await t.rollback();
							return "アイテムは持ってないよ！っ";
						}
						const item = await this.candyItemRepository.findById(
							updated.itemId,
						);
						if (item == null) {
							return "アイテムは持ってないよ！っ";
						}
						return `${item.name.getValue()}と交換したよ！っ`;
					});
			})
			.catch((_err) => "アイテムは持ってないよ！っ");
	}

	async drawItem(userId: DiscordUserId): Promise<string> {
		return await this.transaction.startTransaction(async () => {
			return this.candyRepository
				.ConsumeCandies(userId)
				.then(async (success) => {
					if (!success) {
						return "キャンディがないよ！っ";
					}

					// NOTE:todo より良い乱数生成に変える
					const randomNum = Math.floor(Math.random() * PROBABILITY_JACKPOT + 1);
					if (
						randomNum % PROBABILITY_HIT !== 0 &&
						randomNum % PROBABILITY_JACKPOT !== 0
					) {
						return "ハズレちゃったよ！っ";
					}
					const hitId = new CandyItemId(
						randomNum % PROBABILITY_JACKPOT === 0 ? ID_JACKPOT : ID_HIT,
					);
					//TODO: this creation require just user and hit id
					await this.userCandyItemRepository.create(
						new UserCandyItemDto(
							new UserCandyItemId(0),
							userId,
							hitId,
							new UserCandyItemExpire(
								dayjs().add(1, "day").add(1, "year").startOf("day").toDate(),
							),
						),
					);
					const item = await this.candyItemRepository.findById(hitId);
					return `${item?.name.getValue()}が当たったよ${randomNum % PROBABILITY_JACKPOT === 0 ? "👕" : "🍭"}！っ`;
				});
		});
	}

	async getItems(userId: DiscordUserId): Promise<string> {
		return this.transaction.startTransaction(async () => {
			const userCandyItems =
				await this.userCandyItemRepository.findByNotUsed(userId);

			if (userCandyItems.length === 0) return "アイテムは持ってないよ！っ";
			const texts = userCandyItems.flatMap((u) => [
				`- ${u.name.getValue()} id: ${u.minId.getValue()}`,
				`  - 説明：${u.description.getValue()}`,
				`  - 期限：${dayjs(u.minExpiredAt.getValue()).subtract(1, "d").format("YYYY/MM/DD")}`,
				`  - 個数：${u.count.getValue()}`,
			]);

			return ["以下のアイテムが交換できるよ！っ", ...texts].join("\n");
		});
	}
	async giveCandy(
		receiver: DiscordUserId,
		giver: DiscordUserId,
		messageId: DiscordMessageId,
		messageLink: DiscordMessageLink,
	): Promise<string | undefined> {
		if (receiver.getValue() === giver.getValue()) {
			return;
		}
		return this.mutex.useMutex("GiveCandy", async () =>
			this.transaction.startTransaction(async () => {
				const todayCount = await this.candyRepository.countByToday(giver);
				// reaction limit
				// todo reaction limit to constant
				if (todayCount.getValue() > 2) {
					return "今はスタンプを押してもキャンディをあげられないよ！っ";
				}

				const Candies = await this.candyRepository.findByGiverAndMessageId(
					giver,
					messageId,
				);
				// duplicate reaction
				if (Candies.length > 0) {
					return;
				}
				await this.candyRepository.createCandy(
					new CandyDto(
						receiver,
						giver,
						messageId,
						new CandyExpire(
							dayjs().add(1, "day").add(1, "month").startOf("day").toDate(),
						),
					),
				);
				return `<@${giver.getValue()}>さんが<@${receiver.getValue()}>さんに${AppConfig.backend.candyEmoji}スタンプを押したよ！！っ\nリンク先はこちら！っ: ${messageLink.getValue()}`;
			}),
		);
	}
}
