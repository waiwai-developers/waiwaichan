import { UserPointItemDto } from "@/src/entities/dto/UserPointItemDto";
import type { UserPointItemWithItemDto } from "@/src/entities/dto/UserPointItemWithItemDto";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { PointItemDescription } from "@/src/entities/vo/PointItemDescription";
import { PointItemId } from "@/src/entities/vo/PointItemId";
import { PointItemName } from "@/src/entities/vo/PointItemName";
import { UserPointItemExpire } from "@/src/entities/vo/UserPointItemExpire";
import { UserPointItemId } from "@/src/entities/vo/UserPointItemId";
import type { IUserPointItemRepository } from "@/src/logics/Interfaces/repositories/database/IUserPointItemRepository";
import dayjs from "dayjs";
import { injectable } from "inversify";
import { Op } from "sequelize";
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
import { PointItemRepositoryImpl } from "./PointItemRepositoryImpl";

@injectable()
@Table({
	tableName: "UserItems",
	timestamps: true,
	paranoid: true,
})
class UserPointItemRepositoryImpl
	extends Model
	implements IUserPointItemRepository
{
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.STRING)
	declare userId: string;
	@Column(DataType.STRING)
	@ForeignKey(() => PointItemRepositoryImpl)
	declare itemId: number;
	@Column(DataType.DATE)
	declare expiredAt: Date;

	@BelongsTo(() => PointItemRepositoryImpl)
	declare item: PointItemRepositoryImpl;

	async create(data: UserPointItemDto): Promise<UserPointItemId> {
		return UserPointItemRepositoryImpl.create({
			userId: data.userId.getValue(),
			itemId: data.itemId.getValue(),
			expiredAt: data.expiredAt.getValue(),
		}).then((res) => new UserPointItemId(res.id));
	}

	async findByNotUsed(
		userId: DiscordUserId,
	): Promise<UserPointItemWithItemDto[]> {
		return UserPointItemRepositoryImpl.findAll({
			include: [PointItemRepositoryImpl],
			where: {
				userId: userId.getValue(),
				expiredAt: { [Op.gt]: dayjs().toDate() },
			},
		}).then((r) =>
			r.map((it) => {
				return {
					...this.toDto(it),
					name: new PointItemName(it.item.name),
					description: new PointItemDescription(it.item.description),
				};
			}),
		);
	}

	/**
	 *
	 * @param id the UserPointItem id that created with Vo
	 * @param userId the Discord user id that created with Vo
	 * @return dto that updated item
	 */
	async exchangeById(
		id: UserPointItemId,
		userId: DiscordUserId,
	): Promise<UserPointItemDto | null> {
		return UserPointItemRepositoryImpl.findOne({
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
	}: UserPointItemRepositoryImpl): UserPointItemDto {
		return new UserPointItemDto(
			new UserPointItemId(id),
			new DiscordUserId(userId),
			new PointItemId(itemId),
			new UserPointItemExpire(expiredAt),
		);
	}
}

export { UserPointItemRepositoryImpl };
