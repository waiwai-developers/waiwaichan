import { UserCandyItemDto } from "@/src/entities/dto/UserCandyItemDto";
import type { UserCandyItemWithItemDto } from "@/src/entities/dto/UserCandyItemWithItemDto";
import { CandyItemDescription } from "@/src/entities/vo/CandyItemDescription";
import { CandyItemId } from "@/src/entities/vo/CandyItemId";
import { CandyItemName } from "@/src/entities/vo/CandyItemName";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { UserCandyItemExpire } from "@/src/entities/vo/UserCandyItemExpire";
import { UserCandyItemId } from "@/src/entities/vo/UserCandyItemId";
import type { IUserCandyItemRepository } from "@/src/logics/Interfaces/repositories/database/IUserCandyItemRepository";
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
	): Promise<UserCandyItemWithItemDto[]> {
		return UserCandyItemRepositoryImpl.findAll({
			include: [CandyItemRepositoryImpl],
			where: {
				userId: userId.getValue(),
				expiredAt: { [Op.gt]: dayjs().toDate() },
			},
		}).then((r) =>
			r.map((it) => {
				return {
					...this.toDto(it),
					name: new CandyItemName(it.item.name),
					description: new CandyItemDescription(it.item.description),
				};
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
