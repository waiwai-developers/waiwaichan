import { CandyDto } from "@/src/entities/dto/CandyDto";
import { CandyCount } from "@/src/entities/vo/CandyCount";
import { CandyExpire } from "@/src/entities/vo/CandyExpire";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
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
	declare guildId: string;
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
			guildId: data.guildId.getValue(),
			receiveUserId: data.receiveUserId.getValue(),
			giveUserId: data.giveUserId.getValue(),
			messageId: data.messageId.getValue(),
			expiredAt: data.expiredAt.getValue(),
		});
		return true;
	}

	async candyCount(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
	): Promise<CandyCount> {
		return CandyRepositoryImpl.count({
			where: {
				guildId: guildId.getValue(),
				receiveUserId: userId.getValue(),
				expiredAt: { [Op.gt]: dayjs().toDate() },
			},
		}).then((c) => new CandyCount(c));
	}

	async candyExpire(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
	): Promise<CandyExpire | undefined> {
		return CandyRepositoryImpl.findOne({
			where: {
				guildId: guildId.getValue(),
				receiveUserId: userId.getValue(),
				expiredAt: { [Op.gt]: dayjs().toDate() },
			},
			order: [[col("expiredAt"), "ASC"]],
		}).then((c) => (c ? new CandyExpire(c.expiredAt) : undefined));
	}

	async countByToday(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
	): Promise<CandyCount> {
		return CandyRepositoryImpl.count({
			where: {
				guildId: guildId.getValue(),
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
		guildId: DiscordGuildId,
		userId: DiscordUserId,
		Candies: CandyCount = new CandyCount(1),
	): Promise<boolean> {
		return CandyRepositoryImpl.destroy({
			where: {
				guildId: guildId.getValue(),
				receiveUserId: userId.getValue(),
			},
			limit: Candies.getValue(),
		}).then((res) => res === Candies.getValue());
	}
	async findByGiverAndMessageId(
		guildId: DiscordGuildId,
		giver: DiscordChannelId,
		messageId: DiscordMessageId,
	): Promise<Array<CandyDto>> {
		return CandyRepositoryImpl.findAll({
			where: {
				guildId: guildId.getValue(),
				giveUserId: giver.getValue(),
				messageId: messageId.getValue(),
			},
		}).then((res) => res.map((r) => this.toDto(r)));
	}
	toDto({
		guildId,
		receiveUserId,
		giveUserId,
		messageId,
		expiredAt,
	}: CandyRepositoryImpl): CandyDto {
		return new CandyDto(
			new DiscordGuildId(guildId),
			new DiscordUserId(receiveUserId),
			new DiscordUserId(giveUserId),
			new DiscordMessageId(messageId),
			new CandyExpire(expiredAt),
		);
	}
}
export { CandyRepositoryImpl };
