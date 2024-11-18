import config from "@/config.json";
import { PointDto } from "@/entities/dto/PointDto";
import type { DiscordMessageId } from "@/entities/vo/DiscordMessageId";
import type { DiscordUserId } from "@/entities/vo/DiscordUserId";
import { PointExpire } from "@/entities/vo/PointExpire";
import { PointStatus } from "@/entities/vo/PointStatus";
import type { UserPointItemId } from "@/entities/vo/UserPointItemId";
import type { IPointLogic } from "@/logics/Interfaces/logics/IPointLogic";
import type { IPointItemRepository } from "@/logics/Interfaces/repositories/database/IPointItemRepository";
import type { IPointRepository } from "@/logics/Interfaces/repositories/database/IPointRepository";
import type { IUserPointItemRepository } from "@/logics/Interfaces/repositories/database/IUserPointItemRepository";
import dayjs from "dayjs";

export class PointLogic implements IPointLogic {
	constructor(
		private readonly pointRepository: IPointRepository,
		private readonly pointItemRepository: IPointItemRepository,
		private readonly userPointItemRepository: IUserPointItemRepository,
	) {}
	check(userId: DiscordUserId): Promise<string> {
		throw new Error("Method not implemented.");
	}
	exchange(
		userId: DiscordUserId,
		UserPointItemId: UserPointItemId,
	): Promise<string> {
		throw new Error("Method not implemented.");
	}
	drawItem(userId: DiscordUserId): Promise<string> {
		throw new Error("Method not implemented.");
	}
	getItems(userId: DiscordUserId): Promise<string> {
		throw new Error("Method not implemented.");
	}
	async givePoint(
		receiver: DiscordUserId,
		giver: DiscordUserId,
		messageId: DiscordMessageId,
	): Promise<string | undefined> {
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

		return `<@${giver.getValue()}>さんが${config.backend.pointEmoji}スタンプを押したよ！！っ`;
	}
}
