import { PointDto } from "@/src/entities/dto/PointDto";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { PointCount } from "@/src/entities/vo/PointCount";
import { PointExpire } from "@/src/entities/vo/PointExpire";
import { PointStatus } from "@/src/entities/vo/PointStatus";
import type { IPointRepository } from "@/src/logics/Interfaces/repositories/database/IPointRepository";
import dayjs from "dayjs";
import { injectable } from "inversify";
import { Op } from "sequelize";
import {
	AutoIncrement,
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@injectable()
@Table({
	tableName: "Points",
	timestamps: true,
})
class PointRepositoryImpl extends Model implements IPointRepository {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.STRING)
	declare receiveUserId: string;
	@Column(DataType.STRING)
	declare giveUserId: string;
	@Column(DataType.STRING)
	declare messageId: string;
	@Column(DataType.STRING)
	declare status: boolean;
	@Column(DataType.DATE)
	declare expiredAt: Date;

	async createPoint(data: PointDto): Promise<boolean> {
		await PointRepositoryImpl.create({
			receiveUserId: data.receiveUserId.getValue(),
			giveUserId: data.giveUserId.getValue(),
			messageId: data.messageId.getValue(),
			status: data.status.getValue(),
			expiredAt: data.expiredAt.getValue(),
		});
		return true;
	}

	async pointCount(userId: DiscordUserId): Promise<PointCount> {
		return PointRepositoryImpl.count({
			where: {
				receiveUserId: userId.getValue(),
				status: PointStatus.UNUSED.getValue(),
				expiredAt: { [Op.gt]: dayjs().toDate() },
			},
		}).then((c) => new PointCount(c));
	}

	async countByToday(userId: DiscordUserId): Promise<PointCount> {
		return PointRepositoryImpl.count({
			where: {
				giveUserId: userId.getValue(),
				createdAt: { [Op.gte]: dayjs().subtract(1, "day").toDate() },
			},
		}).then((c) => new PointCount(c));
	}

	async ConsumePoints(
		userId: DiscordUserId,
		points: PointCount = new PointCount(1),
	): Promise<boolean> {
		return PointRepositoryImpl.update(
			{ status: PointStatus.USED.getValue() },
			{
				where: {
					receiveUserId: userId.getValue(),
					status: PointStatus.UNUSED.getValue(),
				},
				limit: points.getValue(),
			},
		).then((updated) => updated[0] > 0);
	}
	async findByGiverAndMessageId(
		giver: DiscordChannelId,
		messageId: DiscordMessageId,
	): Promise<Array<PointDto>> {
		return PointRepositoryImpl.findAll({
			where: {
				giveUserId: giver.getValue(),
				messageId: messageId.getValue(),
			},
		}).then((res) => res.map((r) => this.toDto(r)));
	}
	toDto({
		receiveUserId,
		giveUserId,
		messageId,
		status,
		expiredAt,
	}: PointRepositoryImpl): PointDto {
		return new PointDto(
			new DiscordUserId(receiveUserId),
			new DiscordUserId(giveUserId),
			new DiscordMessageId(messageId),
			new PointStatus(status),
			new PointExpire(expiredAt),
		);
	}
}
export { PointRepositoryImpl };
