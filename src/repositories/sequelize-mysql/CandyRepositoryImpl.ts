import { AppConfig } from "@/src/entities/config/AppConfig";
import { CandyDto } from "@/src/entities/dto/CandyDto";
import { CandyCount } from "@/src/entities/vo/CandyCount";
import type { CandyId } from "@/src/entities/vo/CandyId";
import { CandyExpire } from "@/src/entities/vo/CandyExpire";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { ICandyRepository } from "@/src/logics/Interfaces/repositories/database/ICandyRepository";
import dayjs from "dayjs";
import { injectable } from "inversify";
import { Op, col } from "sequelize";
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
	tableName: "Candies",
	timestamps: true,
	paranoid: true,
})
class CandyRepositoryImpl extends Model implements ICandyRepository {
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
	@Column(DataType.DATE)
	declare expiredAt: Date;

	async createCandy(data: CandyDto): Promise<boolean> {
		await CandyRepositoryImpl.create({
			receiveUserId: data.receiveUserId.getValue(),
			giveUserId: data.giveUserId.getValue(),
			messageId: data.messageId.getValue(),
			expiredAt: data.expiredAt.getValue(),
		});
		return true;
	}

	async candyCount(userId: DiscordUserId): Promise<CandyCount> {
		return CandyRepositoryImpl.count({
			where: {
				receiveUserId: userId.getValue(),
				expiredAt: { [Op.gt]: dayjs().toDate() },
			},
		}).then((c) => new CandyCount(c));
	}

	async candyCountFromJackpod(
		userId: DiscordUserId,
		candyId: CandyId | undefined,
	): Promise<CandyCount> {
		return CandyRepositoryImpl.count({
			where: {
				receiveUserId: userId.getValue(),
				deletedAt: { [Op.ne]: null },
				...(candyId ? { candyId: { [Op.gt]: candyId.getValue() } } : {}),
			},
			paranoid: false,
		}).then((c) => new CandyCount(c));
	}

	async candyExpire(userId: DiscordUserId): Promise<CandyExpire | undefined> {
		return CandyRepositoryImpl.findOne({
			where: {
				receiveUserId: userId.getValue(),
				expiredAt: { [Op.gt]: dayjs().toDate() },
			},
			order: [[col("expiredAt"), "ASC"]],
		}).then((c) => (c ? new CandyExpire(c.expiredAt) : undefined));
	}

	async countByToday(userId: DiscordUserId): Promise<CandyCount> {
		return CandyRepositoryImpl.count({
			where: {
				giveUserId: userId.getValue(),
				createdAt: {
					[Op.gte]: dayjs()
						.add(9, "h")
						.startOf("day")
						.subtract(9, "h")
						.toDate(),
				},
			},
			paranoid: false,
		}).then((c) => new CandyCount(c));
	}

	async ConsumeCandies(
		userId: DiscordUserId,
		Candies: CandyCount = new CandyCount(1),
	): Promise<boolean> {
		return CandyRepositoryImpl.destroy({
			where: {
				receiveUserId: userId.getValue(),
			},
			limit: Candies.getValue(),
		}).then((res) => res === Candies.getValue());
	}

	async findByGiverAndMessageId(
		giver: DiscordChannelId,
		messageId: DiscordMessageId,
	): Promise<Array<CandyDto>> {
		return CandyRepositoryImpl.findAll({
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
		expiredAt,
	}: CandyRepositoryImpl): CandyDto {
		return new CandyDto(
			new DiscordUserId(receiveUserId),
			new DiscordUserId(giveUserId),
			new DiscordMessageId(messageId),
			new CandyExpire(expiredAt),
		);
	}
}
export { CandyRepositoryImpl };
