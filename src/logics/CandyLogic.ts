import { AppConfig } from "@/src/entities/config/AppConfig";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import {
	CEILING_JACKPOT,
	ID_HIT,
	ID_JACKPOT,
	ID_OUT,
	PROBABILITY_HIT,
	PROBABILITY_JACKPOT,
} from "@/src/entities/constants/Items";
import { CandyDto } from "@/src/entities/dto/CandyDto";
import { UserCandyItemDto } from "@/src/entities/dto/UserCandyItemDto";
import { CandyCount } from "@/src/entities/vo/CandyCount";
import { CandyExpire } from "@/src/entities/vo/CandyExpire";
import { CandyId } from "@/src/entities/vo/CandyId";
import { CandyItemId } from "@/src/entities/vo/CandyItemId";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordMessageLink } from "@/src/entities/vo/DiscordMessageLink";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { UserCandyItemCount } from "@/src/entities/vo/UserCandyItemCount";
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
	private readonly transaction!: ITransaction;

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
		type: CandyItemId,
		amount: UserCandyItemCount,
	): Promise<string> {
		return this.transaction
			.startTransaction(async () => {
				return this.userCandyItemRepository
					.exchangeByTypeAndAmount(userId, type, amount)
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

	async drawSeriesItem(userId: DiscordUserId): Promise<string> {
		return await this.transaction
			.startTransaction(async () => {
				// candyの消費
				const candyIds = await this.candyRepository.consumeCandies(
					userId,
					new CandyCount(AppConfig.backend.candySeriesAmount),
				);
				if (candyIds.length === AppConfig.backend.candySeriesAmount) {
					throw new Error(
						"Have less than the number of consecutive items need to consume",
					);
				}

				// itemの抽選
				let randomNums: number[] = [];
				do {
					const selectRandomNums = [];
					for (let i = 0; i < AppConfig.backend.candySeriesAmount; i++) {
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

				//天上の場合に置換
				const lastJackpodId =
					await this.userCandyItemRepository.lastJackpodId(userId);

				const candyCountFromJackpod =
					await this.candyRepository.candyCountFromJackpod(
						userId,
						lastJackpodId ? new CandyId(lastJackpodId?.getValue()) : undefined,
					);
				if (
					candyCountFromJackpod.getValue() +
						AppConfig.backend.candySeriesAmount >=
					CEILING_JACKPOT
				) {
					randomNums.splice(
						CEILING_JACKPOT - candyCountFromJackpod.getValue() - 1,
						1,
						PROBABILITY_JACKPOT,
					);
				}

				const mapCandyIdHitIds = [...Array(AppConfig.backend.candySeriesAmount)]
					.map((v, i) => i)
					.map((i) => ({
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
							userId,
							m.hitId,
							m.candyId,
							new UserCandyItemExpire(
								dayjs().add(1, "day").add(1, "year").startOf("day").toDate(),
							),
						),
				);
				await this.userCandyItemRepository.bulkCreate(userCandyItems);

				const candyItems = await this.candyItemRepository.findAll();
				const resultTexts = randomNums.map((n) => {
					if (n % PROBABILITY_JACKPOT === 0) {
						return `- ${candyItems?.find((c) => c.id.getValue() === ID_JACKPOT)?.name.getValue()}が当たったよ👕！っ`;
					}
					if (n % PROBABILITY_HIT === 0) {
						return `- ${candyItems?.find((c) => c.id.getValue() === ID_HIT)?.name.getValue()}が当たったよ🍭！っ`;
					}
					return "- ハズレちゃったよ！っ";
				});
				const texts = ["結果は以下だよ！っ", ...resultTexts];

				return texts.join("\n");
			})
			.catch((_err) => "キャンディの数が足りないよ！っ");
	}

	async drawItem(userId: DiscordUserId): Promise<string> {
		return await this.transaction.startTransaction(async () => {
			return this.candyRepository.consumeCandy(userId).then(async (candyId) => {
				if (!candyId) {
					return "キャンディがないよ！っ";
				}

				// NOTE:todo より良い乱数生成に変える
				let randomNum = Math.floor(Math.random() * PROBABILITY_JACKPOT + 1);

				//天上の場合に置換
				const lastJackpodId =
					await this.userCandyItemRepository.lastJackpodId(userId);

				console.log("aaaaaaaaa");
				console.log(lastJackpodId);
				console.log("aaaaaaaaa");

				const candyCountFromJackpod =
					await this.candyRepository.candyCountFromJackpod(
						userId,
						lastJackpodId ? new CandyId(lastJackpodId?.getValue()) : undefined,
					);
				if (candyCountFromJackpod.getValue() >= CEILING_JACKPOT) {
					randomNum = PROBABILITY_JACKPOT;
				}

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
						candyId,
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
