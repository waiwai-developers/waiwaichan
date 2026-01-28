import { CandyDto } from "@/src/entities/dto/CandyDto";
import { CandyCategoryType } from "@/src/entities/vo/CandyCategoryType";
import { CandyCount } from "@/src/entities/vo/CandyCount";
import type { CandyCreatedAt } from "@/src/entities/vo/CandyCreatedAt";
import { CandyExpire } from "@/src/entities/vo/CandyExpire";
import { CandyId } from "@/src/entities/vo/CandyId";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import { MessageId } from "@/src/entities/vo/MessageId";
import { UserId } from "@/src/entities/vo/UserId";
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
	@Column(DataType.INTEGER)
	declare communityId: number;
	@Column(DataType.BIGINT)
	declare userId: number;
	@Column(DataType.BIGINT)
	declare giveUserId: number;
	@Column(DataType.INTEGER)
	declare messageId: number;
	@Column(DataType.INTEGER)
	declare categoryType: number;
	@Column(DataType.DATE)
	declare expiredAt: Date;

	async bulkCreateCandy(data: CandyDto[]): Promise<boolean> {
		await CandyRepositoryImpl.bulkCreate(
			data.map((d) => ({
				communityId: d.communityId.getValue(),
				userId: d.userId.getValue(),
				giveUserId: d.giveUserId.getValue(),
				messageId: d.messageId.getValue(),
				categoryType: d.categoryType.getValue(),
				expiredAt: d.expiredAt.getValue(),
			})),
		);
		return true;
	}

	async candyCount(
		communityId: CommunityId,
		userId: UserId,
	): Promise<CandyCount> {
		return CandyRepositoryImpl.count({
			where: {
				communityId: Number(communityId.getValue()),
				userId: Number(userId.getValue()),
				expiredAt: { [Op.gt]: dayjs().toDate() },
			},
		}).then((c) => new CandyCount(c));
	}

	async candyCountFromJackpod(
		communityId: CommunityId,
		userId: UserId,
		candyId: CandyId | undefined,
	): Promise<CandyCount> {
		return CandyRepositoryImpl.count({
			where: {
				communityId: communityId.getValue(),
				userId: userId.getValue(),
				deletedAt: { [Op.ne]: null },
				...(candyId ? { id: { [Op.gt]: candyId.getValue() } } : {}),
			},
			paranoid: false,
		}).then((c) => new CandyCount(c));
	}

	async candyExpire(
		communityId: CommunityId,
		userId: UserId,
	): Promise<CandyExpire | undefined> {
		return CandyRepositoryImpl.findOne({
			where: {
				communityId: communityId.getValue(),
				userId: userId.getValue(),
				expiredAt: { [Op.gt]: dayjs().toDate() },
			},
			order: [[col("expiredAt"), "ASC"]],
		}).then((c) => (c ? new CandyExpire(c.expiredAt) : undefined));
	}

	async countByPeriod(
		communityId: CommunityId,
		userId: UserId,
		categoryType: CandyCategoryType,
		createdAt: CandyCreatedAt,
	): Promise<CandyCount> {
		return CandyRepositoryImpl.count({
			where: {
				communityId: communityId.getValue(),
				giveUserId: userId.getValue(),
				categoryType: categoryType.getValue(),
				createdAt: { [Op.gte]: createdAt.getValue() },
			},
			paranoid: false,
		}).then((c) => new CandyCount(c));
	}

	async consumeCandies(
		communityId: CommunityId,
		userId: UserId,
		candyCount: CandyCount,
	): Promise<CandyId[]> {
		return CandyRepositoryImpl.findAll({
			where: {
				communityId: communityId.getValue(),
				userId: userId.getValue(),
				expiredAt: { [Op.gt]: dayjs().toDate() },
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
		communityId: CommunityId,
		giver: UserId,
		messageId: MessageId,
		categoryType: CandyCategoryType,
	): Promise<Array<CandyDto>> {
		return CandyRepositoryImpl.findAll({
			where: {
				communityId: communityId.getValue(),
				giveUserId: giver.getValue(),
				messageId: messageId.getValue(),
				categoryType: categoryType.getValue(),
			},
		}).then((res) => res.map((r) => this.toDto(r)));
	}
	toDto({
		communityId,
		userId,
		giveUserId,
		messageId,
		categoryType,
		expiredAt,
	}: CandyRepositoryImpl): CandyDto {
		return new CandyDto(
			new CommunityId(communityId),
			new UserId(userId),
			new UserId(giveUserId),
			new MessageId(messageId),
			new CandyCategoryType(categoryType),
			new CandyExpire(expiredAt),
		);
	}
}
export { CandyRepositoryImpl };
