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
import { DataTypes, Model, Op } from "sequelize";
import { PointItemRepositoryImpl } from "./PointItemRepositoryImpl";
import { MysqlConnector } from "./mysqlConnector";

const sequelize = MysqlConnector.getInstance();

@injectable()
class PointRepositoryImpl extends Model implements IPointRepository {
	declare id: number;
	declare receiveUserId: string;
	declare giveUserId: string;
	declare messageId: string;
	declare status: boolean;
	declare expiredAt: Date;

	async createPoint(data: PointDto): Promise<boolean> {
		try {
			await PointRepositoryImpl.create({
				receiveUserId: data.receiveUserId.getValue(),
				giveUserId: data.giveUserId.getValue(),
				messageId: data.messageId.getValue(),
				status: data.status.getValue(),
				expiredAt: data.expiredAt.getValue(),
			});
			return true;
		} catch (err) {
			return false;
		}
	}

	async pointCount(userId: DiscordUserId): Promise<PointCount> {
		return PointRepositoryImpl.count({
			where: {
				receiveUserId: userId.getValue(),
				status: PointStatus.UNUSED.getValue(),
				expiredAt: { [Op.gte]: dayjs().toDate() },
			},
		}).then((c) => new PointCount(c));
	}

	async countByToday(userId: DiscordUserId): Promise<PointCount> {
		return PointRepositoryImpl.count({
			where: {
				receiveUserId: userId.getValue(),
				status: PointStatus.UNUSED.getValue(),
				expiredAt: { [Op.gte]: dayjs().toDate() },
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

PointRepositoryImpl.init(
	{
		receiveUserId: DataTypes.BIGINT,
		giveUserId: DataTypes.BIGINT,
		messageId: DataTypes.BIGINT,
		status: DataTypes.BOOLEAN,
		expiredAt: DataTypes.DATE,
	},
	{
		sequelize,
		modelName: "Point",
	},
);

export { PointRepositoryImpl };
