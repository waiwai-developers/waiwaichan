import { ID_JACKPOT } from "@/src/entities/constants/Items";
import { UserCandyItemDto } from "@/src/entities/dto/UserCandyItemDto";
import { UserCandyItemWithItemGroupByDto } from "@/src/entities/dto/UserCandyItemWithItemGroupByDto";
import { CandyId } from "@/src/entities/vo/CandyId";
import { CandyItemDescription } from "@/src/entities/vo/CandyItemDescription";
import { CandyItemId } from "@/src/entities/vo/CandyItemId";
import { CandyItemName } from "@/src/entities/vo/CandyItemName";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { UserCandyItemCount } from "@/src/entities/vo/UserCandyItemCount";
import { UserCandyItemExpire } from "@/src/entities/vo/UserCandyItemExpire";
import { UserCandyItemId } from "@/src/entities/vo/UserCandyItemId";
import { UserCandyItemMinExpire } from "@/src/entities/vo/UserCandyItemMinExpire";
import { UserCandyItemMinId } from "@/src/entities/vo/UserCandyItemMinId";
import type { IUserCandyItemRepository } from "@/src/logics/Interfaces/repositories/database/IUserCandyItemRepository";
import dayjs from "dayjs";
import { injectable } from "inversify";
import { Op, Transaction, col, fn } from "sequelize";
import {
	AutoIncrement,
	BelongsTo,
	Column,
	DataType,
	ForeignKey,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";
import { CandyItemRepositoryImpl } from "./CandyItemRepositoryImpl";

@injectable()
@Table({
	tableName: "UserItems",
	timestamps: true,
	paranoid: true,
})
class UserCandyItemRepositoryImpl
	extends Model
	implements IUserCandyItemRepository
{
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.STRING)
	declare userId: string;
	@Column(DataType.STRING)
	declare guildId: string;
	@Column(DataType.STRING)
	@ForeignKey(() => CandyItemRepositoryImpl)
	declare itemId: number;
	@Column(DataType.INTEGER)
	declare candyId: number;
	@Column(DataType.DATE)
	declare expiredAt: Date;
	@Column(DataType.INTEGER)
	declare aggrCount: number;
	@Column(DataType.INTEGER)
	declare aggrMinId: number;
	@Column(DataType.DATE)
	declare aggrMinExpiredAt: Date;

	@BelongsTo(() => CandyItemRepositoryImpl)
	declare item: CandyItemRepositoryImpl;

	async bulkCreate(data: UserCandyItemDto[]): Promise<UserCandyItemId[]> {
		return UserCandyItemRepositoryImpl.bulkCreate(
			data.map((u) => ({
				guildId: u.guildId.getValue(),
				userId: u.userId.getValue(),
				itemId: u.itemId.getValue(),
				candyId: u.candyId.getValue(),
				expiredAt: u.expiredAt.getValue(),
			})),
		).then((res) => res.map((r) => new UserCandyItemId(r.id)));
	}

	async findByNotUsed(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
	): Promise<UserCandyItemWithItemGroupByDto[]> {
		return UserCandyItemRepositoryImpl.findAll({
			include: [CandyItemRepositoryImpl],
			attributes: [
				"userId",
				"itemId",
				[fn("COUNT", col("UserCandyItemRepositoryImpl.id")), "aggrCount"],
				[fn("MIN", col("UserCandyItemRepositoryImpl.id")), "aggrMinId"],
				[fn("MIN", col("expiredAt")), "aggrMinExpiredAt"],
			],
			where: {
				guildId: guildId.getValue(),
				userId: userId.getValue(),
				expiredAt: { [Op.gt]: dayjs().toDate() },
			},
			group: ["itemId"],
		}).then((r) =>
			r.map((it) => {
				return new UserCandyItemWithItemGroupByDto(
					new CandyItemName(it.userId),
					new CandyItemId(it.item.id),
					new CandyItemName(it.item.name),
					new CandyItemDescription(it.item.description),
					new UserCandyItemCount(it.aggrCount),
					new UserCandyItemMinId(it.aggrMinId),
					new UserCandyItemMinExpire(it.aggrMinExpiredAt),
				);
			}),
		);
	}

	async lastJackpodCandyId(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
	): Promise<CandyId | undefined> {
		return UserCandyItemRepositoryImpl.findOne({
			attributes: ["candyId"],
			where: {
				guildId: guildId.getValue(),
				itemId: ID_JACKPOT,
				userId: userId.getValue(),
			},
			order: [["createdAt", "DESC"]],
		}).then((i) => (i ? new CandyId(i.candyId) : undefined));
	}

	/**
	 *
	 * @param userId the Discord user id that created with Vo
	 * @param type the CandyItem id that created with Vo
	 * @param amount the Exchange candy amount that created with Vo
	 * @return dto that updated item
	 */
	async exchangeByTypeAndAmount(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
		type: CandyItemId,
		amount: UserCandyItemCount,
	): Promise<number> {
		const lockedIds = await UserCandyItemRepositoryImpl.findAll({
			attributes: ["id"],
			where: {
				guildId: guildId.getValue(),
				userId: userId.getValue(),
				itemId: type.getValue(),
				expiredAt: { [Op.gt]: dayjs().toDate() },
			},
			order: [["expiredAt", "ASC"]],
			limit: amount.getValue(),
			lock: Transaction.LOCK.UPDATE,
		}).then((res) => {
			if (res.length < amount.getValue()) {
				throw Error("no items found for satisfy request");
			}
			return res.map((it) => it.id);
		});
		return UserCandyItemRepositoryImpl.destroy({
			where: {
				id: lockedIds,
			},
		});
	}

	toDto({
		id,
		guildId,
		userId,
		itemId,
		candyId,
		expiredAt,
	}: UserCandyItemRepositoryImpl): UserCandyItemDto {
		return new UserCandyItemDto(
			new UserCandyItemId(id),
			new DiscordGuildId(guildId),
			new DiscordUserId(userId),
			new CandyItemId(itemId),
			new CandyId(candyId),
			new UserCandyItemExpire(expiredAt),
		);
	}
}

export { UserCandyItemRepositoryImpl };
