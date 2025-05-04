import { CandyDto } from "@/src/entities/dto/CandyDto";
import { CandyCategoryType } from "@/src/entities/vo/CandyCategoryType";
import { CandyCount } from "@/src/entities/vo/CandyCount";
import type { CandyCreatedAt } from "@/src/entities/vo/CandyCreatedAt";
import { CandyExpire } from "@/src/entities/vo/CandyExpire";
import { CandyId } from "@/src/entities/vo/CandyId";
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
	@Column(DataType.INTEGER)
	declare categoryType: number;
	@Column(DataType.DATE)
	declare expiredAt: Date;

	async bulkCreateCandy(data: CandyDto[]): Promise<boolean> {
		await CandyRepositoryImpl.bulkCreate(
			data.map((d) => ({
				receiveUserId: d.receiveUserId.getValue(),
				giveUserId: d.giveUserId.getValue(),
				messageId: d.messageId.getValue(),
				categoryType: d.categoryType.getValue(),
				expiredAt: d.expiredAt.getValue(),
			})),
		);
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
				...(candyId ? { id: { [Op.gt]: candyId.getValue() } } : {}),
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

	async countByPeriod(
		userId: DiscordUserId,
		categoryType: CandyCategoryType,
		createdAt: CandyCreatedAt,
	): Promise<CandyCount> {
		return CandyRepositoryImpl.count({
			where: {
				giveUserId: userId.getValue(),
				categoryType: categoryType.getValue(),
				createdAt: { [Op.gte]: createdAt.getValue() },
			},
			paranoid: false,
		}).then((c) => new CandyCount(c));
	}

	async consumeCandies(
		userId: DiscordUserId,
		candyCount: CandyCount,
	): Promise<CandyId[]> {
		return CandyRepositoryImpl.findAll({
			where: {
				receiveUserId: userId.getValue(),
			},
			limit: candyCount.getValue(),
		}).then((cs) => {
			CandyRepositoryImpl.destroy({
				where: {
					id: {
						[Op.in]: cs.map((c) => {
							return c.id;
						}),
					},
				},
			});
			return cs.map((c) => {
				return new CandyId(c.id);
			});
		});
	}

	async findByGiverAndMessageId(
		giver: DiscordChannelId,
		messageId: DiscordMessageId,
		categoryType: CandyCategoryType,
	): Promise<Array<CandyDto>> {
		return CandyRepositoryImpl.findAll({
			where: {
				giveUserId: giver.getValue(),
				messageId: messageId.getValue(),
				categoryType: categoryType.getValue(),
			},
		}).then((res) => res.map((r) => this.toDto(r)));
	}
	toDto({
		receiveUserId,
		giveUserId,
		messageId,
		categoryType,
		expiredAt,
	}: CandyRepositoryImpl): CandyDto {
		return new CandyDto(
			new DiscordUserId(receiveUserId),
			new DiscordUserId(giveUserId),
			new DiscordMessageId(messageId),
			new CandyCategoryType(categoryType),
			new CandyExpire(expiredAt),
		);
	}
}
export { CandyRepositoryImpl };
