import { UserCandyItemDto } from "@/src/entities/dto/UserCandyItemDto";
import { UserCandyItemWithItemGroupByDto } from "@/src/entities/dto/UserCandyItemWithItemGroupByDto";
import { CandyItemDescription } from "@/src/entities/vo/CandyItemDescription";
import { UserCandyItemMinExpire } from "@/src/entities/vo/UserCandyItemMinExpire";
import { UserCandyItemCount } from "@/src/entities/vo/UserCandyItemCount";
import { CandyItemId } from "@/src/entities/vo/CandyItemId";
import { CandyItemName } from "@/src/entities/vo/CandyItemName";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { UserCandyItemExpire } from "@/src/entities/vo/UserCandyItemExpire";
import { UserCandyItemId } from "@/src/entities/vo/UserCandyItemId";
import { UserCandyItemMinId } from "@/src/entities/vo/UserCandyItemMinId";
import type { IUserCandyItemRepository } from "@/src/logics/Interfaces/repositories/database/IUserCandyItemRepository";
import dayjs from "dayjs";
import { injectable } from "inversify";
import { Op, fn, col } from  "sequelize";
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

	async findByNotUsed(
		userId: DiscordUserId,
	): Promise<UserCandyItemWithItemGroupByDto[]> {
		return UserCandyItemRepositoryImpl.findAll({
			include: [CandyItemRepositoryImpl],
			attributes: [
				'userId',
				'itemId',
				[fn('COUNT', col('UserCandyItemRepositoryImpl.id')), 'count'],
				[fn('MIN', col('UserCandyItemRepositoryImpl.id')), 'minId'],
				[fn('MIN', col('expiredAt')), 'minExpiredAt']
			],
			where: {
				userId: userId.getValue(),
				expiredAt: { [Op.gt]: dayjs().toDate() },
			},
			group: ['itemId']
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
	 * @param id the UserCandyItem id that created with Vo
	 * @param userId the Discord user id that created with Vo
	 * @return dto that updated item
	 */
	async exchangeById(
		id: UserCandyItemId,
		userId: DiscordUserId,
	): Promise<UserCandyItemDto | null> {
		return UserCandyItemRepositoryImpl.findOne({
			attributes: [
				'id',
				'userId',
				'itemId',
				'expiredAt',
			],
			where: {
				id: id.getValue(),
				userId: userId.getValue(),
				expiredAt: { [Op.gt]: dayjs().toDate() },
			},
		}).then((res) => {
			if (res === null) {
				throw Error("no item deleted");
			}
			res.destroy();
			return res ? this.toDto(res) : null;
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
