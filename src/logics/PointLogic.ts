import { AppConfig } from "@/src/entities/config/AppConfig";
import { RepoTypes } from "@/src/entities/constants/DIContainerTypes";
import {
	ID_HIT,
	ID_JACKPOT,
	PROBABILITY_HIT,
	PROBABILITY_JACKPOT,
} from "@/src/entities/constants/Items";
import { PointDto } from "@/src/entities/dto/PointDto";
import { UserPointItemDto } from "@/src/entities/dto/UserPointItemDto";
import type { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { PointExpire } from "@/src/entities/vo/PointExpire";
import { PointItemId } from "@/src/entities/vo/PointItemId";
import { PointStatus } from "@/src/entities/vo/PointStatus";
import { UserPointItemExpire } from "@/src/entities/vo/UserPointItemExpire";
import { UserPointItemId } from "@/src/entities/vo/UserPointItemId";
import { UserPointItemStatus } from "@/src/entities/vo/UserPointItemStatus";
import type { IPointLogic } from "@/src/logics/Interfaces/logics/IPointLogic";
import type { IPointItemRepository } from "@/src/logics/Interfaces/repositories/database/IPointItemRepository";
import type { IPointRepository } from "@/src/logics/Interfaces/repositories/database/IPointRepository";
import type { IUserPointItemRepository } from "@/src/logics/Interfaces/repositories/database/IUserPointItemRepository";
import dayjs from "dayjs";
import { inject, injectable } from "inversify";

@injectable()
export class PointLogic implements IPointLogic {
	@inject(RepoTypes.PointRepository)
	private readonly pointRepository!: IPointRepository;

	@inject(RepoTypes.PointItemRepository)
	private readonly pointItemRepository!: IPointItemRepository;

	@inject(RepoTypes.UserPointItemRepository)
	private readonly userPointItemRepository!: IUserPointItemRepository;

	@inject(RepoTypes.Transaction)
	private readonly transaction!: ITransaction<TransactionLike>;

	async check(userId: DiscordUserId): Promise<string> {
		return this.transaction
			.startTransaction(async () => {
				return this.pointRepository.pointCount(userId);
			})
			.then((point) => {
				if (point.getValue() <= 0) {
					return "ポイントがないよ！っ";
				}

				return `${point.getValue()}ポイントあるよ！っ`;
			});
	}

	async exchange(
		userId: DiscordUserId,
		userPointItemId: UserPointItemId,
	): Promise<string> {
		return this.transaction
			.startTransaction(async (t) => {
				return this.userPointItemRepository
					.exchangeById(userPointItemId, userId)
					.then(async (updated) => {
						if (!updated) {
							await t.rollback();
							return "アイテムは持ってないよ！っ";
						}
						const item = await this.pointItemRepository.findById(
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
			return this.pointRepository
				.ConsumePoints(userId)
				.then(async (success) => {
					if (!success) {
						return "ポイントがないよ！っ";
					}

					// NOTE:todo より良い乱数生成に変える
					const randomNum = Math.floor(Math.random() * PROBABILITY_JACKPOT + 1);
					if (randomNum % PROBABILITY_HIT !== 0) {
						return "ハズレちゃったよ！っ";
					}
					const hitId = new PointItemId(
						randomNum % PROBABILITY_JACKPOT === 0 ? ID_JACKPOT : ID_HIT,
					);
					//TODO: this creation require just user and hit id
					await this.userPointItemRepository.create(
						new UserPointItemDto(
							new UserPointItemId(0),
							userId,
							hitId,
							UserPointItemStatus.UNUSED,
							new UserPointItemExpire(dayjs().add(1, "year").toDate()),
						),
					);
					const item = await this.pointItemRepository.findById(hitId);
					return `${item?.name.getValue()}が当たったよ${randomNum % PROBABILITY_JACKPOT === 0 ? "👕" : "🍭"}！っ`;
				});
		});
	}

	async getItems(userId: DiscordUserId): Promise<string> {
		return this.transaction.startTransaction(async () => {
			const userPointItems =
				await this.userPointItemRepository.findByNotUsed(userId);

			if (userPointItems.length === 0) return "アイテムは持ってないよ！っ";
			const texts = userPointItems.flatMap((u) => [
				`- id: ${u.id.getValue()}`,
				`  - ${u.name.getValue()}`,
				`  - ${u.description.getValue()}`,
			]);

			return ["以下のアイテムが交換できるよ！っ", ...texts].join("\n");
		});
	}
	async givePoint(
		receiver: DiscordUserId,
		giver: DiscordUserId,
		messageId: DiscordMessageId,
	): Promise<string | undefined> {
		if (receiver.getValue() === giver.getValue()) {
			return;
		}
		const todayCount = await this.pointRepository.countByToday(giver);
		// reaction limit
		// todo reaction limit to constant
		if (todayCount.getValue() > 2) {
			return "今はスタンプを押してもポイントをあげられないよ！っ";
		}

		const points = await this.pointRepository.findByGiverAndMessageId(
			giver,
			messageId,
		);
		// duplicate reaction
		if (points.length > 0) {
			return;
		}
		await this.pointRepository.createPoint(
			new PointDto(
				receiver,
				giver,
				messageId,
				PointStatus.UNUSED,
				new PointExpire(dayjs().add(1, "month").toDate()),
			),
		);

		return `<@${giver.getValue()}>さんが${AppConfig.backend.pointEmoji}スタンプを押したよ！！っ`;
	}
}