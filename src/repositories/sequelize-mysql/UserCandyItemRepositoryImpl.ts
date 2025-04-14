import { UserCandyItemDto } from "@/src/entities/dto/UserCandyItemDto";
import { UserCandyItemWithItemGroupByDto } from "@/src/entities/dto/UserCandyItemWithItemGroupByDto";
import { CandyItemDescription } from "@/src/entities/vo/CandyItemDescription";
import { CandyItemId } from "@/src/entities/vo/CandyItemId";
import { CandyItemName } from "@/src/entities/vo/CandyItemName";
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
	@ForeignKey(() => CandyItemRepositoryImpl)
	declare itemId: number;
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

	async create(data: UserCandyItemDto): Promise<UserCandyItemId> {
		return UserCandyItemRepositoryImpl.create({
			userId: data.userId.getValue(),
			itemId: data.itemId.getValue(),
			expiredAt: data.expiredAt.getValue(),
		}).then((res) => new UserCandyItemId(res.id));
	}

	async bulkCreate(data: UserCandyItemDto[]): Promise<UserCandyItemId[]> {
		return UserCandyItemRepositoryImpl.bulkCreate(
			data.map((u) => ({
				userId: u.userId.getValue(),
				itemId: u.itemId.getValue(),
				expiredAt: u.expiredAt.getValue(),
			})),
		).then((res) => res.map((r) => new UserCandyItemId(r.id)));
	}

	async findByNotUsed(
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

	/**
	 *
	 * @param userId the Discord user id that created with Vo
	 * @param type the CandyItem id that created with Vo
	 * @param amount the Exchange candy amount that created with Vo
	 * @return dto that updated item
	 */
	async exchangeByTypeAndAmount(
		userId: DiscordUserId,
		type: CandyItemId,
		amount: UserCandyItemCount,
	): Promise<number> {
		const lockedIds = await UserCandyItemRepositoryImpl.findAll({
			attributes: ["id"],
			where: {
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
		userId,
		itemId,
		expiredAt,
	}: UserCandyItemRepositoryImpl): UserCandyItemDto {
		return new UserCandyItemDto(
			new UserCandyItemId(id),
			new DiscordUserId(userId),
			new CandyItemId(itemId),
			new UserCandyItemExpire(expiredAt),
		);
	}
}

export { UserCandyItemRepositoryImpl };
