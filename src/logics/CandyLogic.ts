import { AppConfig } from "@/src/entities/config/AppConfig";
import {
	NORMAL_CANDY_AMOUNT,
	NORMAL_CANDY_LIMIT,
	SUPER_CANDY_AMOUNT,
	SUPER_CANDY_LIMIT,
} from "@/src/entities/constants/Candies";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import {
	ID_HIT,
	ID_JACKPOT,
	ID_OUT,
	PITY_COUNT,
	PROBABILITY_HIT,
	PROBABILITY_JACKPOT,
} from "@/src/entities/constants/Items";
import { CandyDto } from "@/src/entities/dto/CandyDto";
import { UserCandyItemDto } from "@/src/entities/dto/UserCandyItemDto";
import { CandyCategoryType } from "@/src/entities/vo/CandyCategoryType";
import { CandyCount } from "@/src/entities/vo/CandyCount";
import { CandyCreatedAt } from "@/src/entities/vo/CandyCreatedAt";
import { CandyExpire } from "@/src/entities/vo/CandyExpire";
import { CandyId } from "@/src/entities/vo/CandyId";
import { CandyItemId } from "@/src/entities/vo/CandyItemId";
import type { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordMessageLink } from "@/src/entities/vo/DiscordMessageLink";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { UserCandyItemCount } from "@/src/entities/vo/UserCandyItemCount";
import { UserCandyItemExpire } from "@/src/entities/vo/UserCandyItemExpire";
import { UserCandyItemId } from "@/src/entities/vo/UserCandyItemId";
import type { ICandyLogic } from "@/src/logics/Interfaces/logics/ICandyLogic";
import type { ICandyItemRepository } from "@/src/logics/Interfaces/repositories/database/ICandyItemRepository";
import type { ICandyRepository } from "@/src/logics/Interfaces/repositories/database/ICandyRepository";
import type { ITransaction } from "@/src/logics/Interfaces/repositories/database/ITransaction";
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
	private readonly transaction!: ITransaction;

	@inject(RepoTypes.Mutex)
	private readonly mutex!: IMutex;

	async check(guildId: DiscordGuildId, userId: DiscordUserId): Promise<string> {
		const candyCount = await this.candyRepository
			.candyCount(guildId, userId)
			.then((candyCount) => candyCount.getValue());

		if (candyCount <= 0) {
			return "キャンディがないよ！っ";
		}

		const candyExpire = await this.candyRepository
			.candyExpire(guildId, userId)
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
		guildId: DiscordGuildId,
		userId: DiscordUserId,
		type: CandyItemId,
		amount: UserCandyItemCount,
	): Promise<string> {
		return this.transaction
			.startTransaction(async () => {
				return this.userCandyItemRepository
					.exchangeByTypeAndAmount(guildId, userId, type, amount)
					.then(async (updated) => {
						if (updated !== amount.getValue()) {
							throw new Error(
								"The requested amount and received amount is not matched",
							);
						}
						const item = await this.candyItemRepository.findById(type);
						if (item == null) {
							throw new Error(
								`no item found that specify by type ${type.getValue()}`,
							);
						}
						return `${item.name.getValue()}${amount.getValue() > 1 ? `${amount.getValue()}個` : ""}と交換したよ！っ`;
					});
			})
			.catch((_err) => "アイテムは持ってないよ！っ");
	}

	async drawItems(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
		candyConsumeAmount: CandyCount = new CandyCount(1),
	): Promise<string> {
		return await this.transaction
			.startTransaction(async () => {
				// candyの消費
				const candyIds = await this.candyRepository.consumeCandies(
					guildId,
					userId,
					candyConsumeAmount,
				);
				if (candyIds.length !== candyConsumeAmount.getValue()) {
					throw new Error(
						"Have less than the number of consecutive items need to consume",
					);
				}

				// itemの抽選
				let randomNums: number[] = [];
				if (candyIds.length >= AppConfig.backend.candyBoxAmount) {
					// candyboxdrawの場合
					do {
						const selectRandomNums = [];
						for (let i = 0; i < candyConsumeAmount.getValue(); i++) {
							// NOTE:todo より良い乱数生成に変える
							selectRandomNums.push(
								Math.floor(Math.random() * PROBABILITY_JACKPOT + 1),
							);
						}
						randomNums = selectRandomNums;
					} while (
						!randomNums.some(
							(r) => r % PROBABILITY_HIT === 0 || r % PROBABILITY_JACKPOT === 0,
						)
					);
				} else {
					// candydrawの場合
					for (let i = 0; i < candyConsumeAmount.getValue(); i++) {
						// NOTE:todo より良い乱数生成に変える
						randomNums.push(
							Math.floor(Math.random() * PROBABILITY_JACKPOT + 1),
						);
					}
				}

				//天上の場合に置換
				const lastJackpodCandyId =
					await this.userCandyItemRepository.lastJackpodCandyId(userId);
				const candyCountFromJackpod =
					await this.candyRepository.candyCountFromJackpod(
						userId,
						lastJackpodCandyId
							? new CandyId(lastJackpodCandyId?.getValue())
							: undefined,
					);
				const pityIndex =
					PITY_COUNT - (candyCountFromJackpod.getValue() - candyIds.length) - 1;
				const isOverPity = candyCountFromJackpod.getValue() >= PITY_COUNT;
				const isNotJackpotToPity = !randomNums
					.slice(0, pityIndex)
					.includes(PROBABILITY_JACKPOT);
				if (isOverPity && isNotJackpotToPity) {
					randomNums.splice(pityIndex, 1, PROBABILITY_JACKPOT);
				}

				// itemの作成
				const mapCandyIdHitIds = [
					...Array(AppConfig.backend.candyBoxAmount).keys(),
				].map((i) => ({
					candyId: candyIds[i],
					hitId:
						randomNums[i] % PROBABILITY_JACKPOT === 0
							? new CandyItemId(ID_JACKPOT)
							: randomNums[i] % PROBABILITY_HIT === 0
								? new CandyItemId(ID_HIT)
								: new CandyItemId(ID_OUT),
				}));
				const mapWinCandyIdHitIds = mapCandyIdHitIds.filter(
					(m) => m.hitId.getValue() !== ID_OUT,
				);
				const userCandyItems = mapWinCandyIdHitIds.map(
					(m) =>
						new UserCandyItemDto(
							new UserCandyItemId(0),
							guildId,
							userId,
							m.hitId,
							m.candyId,
							new UserCandyItemExpire(
								dayjs().add(1, "day").add(1, "year").startOf("day").toDate(),
							),
						),
				);
				await this.userCandyItemRepository.bulkCreate(userCandyItems);

				//文章を作成し投稿
				const candyItems = await this.candyItemRepository.findAll();
				const texts = randomNums.map((n) => {
					if (n % PROBABILITY_JACKPOT === 0) {
						return `- ${candyItems?.find((c) => c.id.getValue() === ID_JACKPOT)?.name.getValue()}が当たったよ👕！っ`;
					}
					if (n % PROBABILITY_HIT === 0) {
						return `- ${candyItems?.find((c) => c.id.getValue() === ID_HIT)?.name.getValue()}が当たったよ🍭！っ`;
					}
					return "- ハズレちゃったよ！っ";
				});
				return texts.join("\n");
			})
			.catch((_err) => "キャンディの数が足りないよ！っ");
	}

	async getItems(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
	): Promise<string> {
		return this.transaction.startTransaction(async () => {
			const userCandyItems = await this.userCandyItemRepository.findByNotUsed(
				guildId,
				userId,
			);

			if (userCandyItems.length === 0) return "アイテムは持ってないよ！っ";
			const texts = userCandyItems.flatMap((u) => [
				`- ${u.name.getValue()}`,
				`  - 説明：${u.description.getValue()}`,
				`  - 期限：${dayjs(u.minExpiredAt.getValue()).subtract(1, "d").format("YYYY/MM/DD")}`,
				`  - 個数：${u.count.getValue()}`,
			]);

			return ["以下のアイテムが交換できるよ！っ", ...texts].join("\n");
		});
	}

	async giveCandys(
		guildId: DiscordGuildId,
		receiver: DiscordUserId,
		giver: DiscordUserId,
		messageId: DiscordMessageId,
		messageLink: DiscordMessageLink,
		candyCategoryType: CandyCategoryType,
	): Promise<string | undefined> {
		if (receiver.getValue() === giver.getValue()) {
			return;
		}
		return this.mutex.useMutex("GiveCandy", async () =>
			this.transaction.startTransaction(async () => {
				const {
					startDatetime,
					countBylimit,
					candyExpire,
					candyAmount,
					prefixText,
					candyEmoji,
				} = ((ct: CandyCategoryType) => {
					switch (ct.getValue()) {
						case CandyCategoryType.CATEGORY_TYPE_SUPER.getValue():
							return {
								startDatetime: new CandyCreatedAt(
									//super candyの場合は過去一ヶ月の付与を調べる
									dayjs()
										.add(9, "h")
										.startOf("month")
										.subtract(9, "h")
										.toDate(),
								),
								countBylimit: SUPER_CANDY_LIMIT,
								candyExpire: new CandyExpire(
									//super candyもcandyも共通で有効期限は一ヶ月
									dayjs()
										.add(1, "day")
										.add(1, "month")
										.startOf("day")
										.toDate(),
								),
								candyAmount: SUPER_CANDY_AMOUNT,
								prefixText: "特別な",
								candyEmoji: AppConfig.backend.candySuperEmoji,
							};
						case CandyCategoryType.CATEGORY_TYPE_NORMAL.getValue():
							return {
								startDatetime: new CandyCreatedAt(
									//candyの場合は過去一日の付与を調べる
									dayjs()
										.add(9, "h")
										.startOf("day")
										.subtract(9, "h")
										.toDate(),
								),
								countBylimit: NORMAL_CANDY_LIMIT,
								candyExpire: new CandyExpire(
									//super candyもcandyも共通で有効期限は一ヶ月
									dayjs()
										.add(1, "day")
										.add(1, "month")
										.startOf("day")
										.toDate(),
								),
								candyAmount: NORMAL_CANDY_AMOUNT,
								prefixText: "",
								candyEmoji: AppConfig.backend.candyEmoji,
							};
						default:
							return {
								startDatetime: undefined,
								countBylimit: undefined,
								candyExpire: undefined,
								candyAmount: undefined,
								prefixText: undefined,
								candyEmoji: undefined,
							};
					}
				})(candyCategoryType);
				if (
					startDatetime == null ||
					countBylimit == null ||
					candyExpire == null ||
					candyAmount == null ||
					prefixText == null ||
					candyEmoji == null
				) {
					return;
				}

				const countByPeriod = await this.candyRepository.countByPeriod(
					giver,
					candyCategoryType,
					startDatetime,
				);

				// reaction limit
				// todo reaction limit to constant
				if (countByPeriod.getValue() >= countBylimit) {
					return "今はスタンプを押してもキャンディをあげられないよ！っ";
				}

				const candies = await this.candyRepository.findByGiverAndMessageId(
					guildId,
					giver,
					messageId,
					CandyCategoryType.CATEGORY_TYPE_SUPER,
				);
				// duplicate reaction
				if (candies.length > 0) {
					return;
				}

				await this.candyRepository.bulkCreateCandy(
					[...Array(candyAmount)].map(
						() =>
							new CandyDto(
								guildId,
								receiver,
								giver,
								messageId,
								candyCategoryType,
								candyExpire,
							),
					),
				);
				return `<@${giver.getValue()}>さんが<@${receiver.getValue()}>さんに${prefixText + candyEmoji}スタンプを押したよ！！っ\nリンク先はこちら！っ: ${messageLink.getValue()}`;
			}),
		);
	}
}
