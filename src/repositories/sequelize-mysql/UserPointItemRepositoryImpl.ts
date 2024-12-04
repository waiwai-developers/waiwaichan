import { UserPointItemDto } from "@/src/entities/dto/UserPointItemDto";
import type { UserPointItemWithItemDto } from "@/src/entities/dto/UserPointItemWithItemDto";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { PointItemDescription } from "@/src/entities/vo/PointItemDescription";
import { PointItemId } from "@/src/entities/vo/PointItemId";
import { PointItemName } from "@/src/entities/vo/PointItemName";
import { UserPointItemExpire } from "@/src/entities/vo/UserPointItemExpire";
import { UserPointItemId } from "@/src/entities/vo/UserPointItemId";
import { UserPointItemStatus } from "@/src/entities/vo/UserPointItemStatus";
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
	@Column(DataType.STRING)
	declare status: boolean;
	@Column(DataType.DATE)
	declare expiredAt: Date;

	@BelongsTo(() => PointItemRepositoryImpl)
	declare item: PointItemRepositoryImpl;

	async create(data: UserPointItemDto): Promise<UserPointItemId> {
		return UserPointItemRepositoryImpl.create({
			userId: data.userId.getValue(),
			itemId: data.itemId.getValue(),
			status: data.status.getValue(),
			expiredAt: data.expiredAt.getValue(),
		}).then((res) => new UserPointItemId(res.id));
	}

	async findByNotUsed(
		userId: DiscordUserId,
		userStatus: UserPointItemStatus = UserPointItemStatus.UNUSED,
	): Promise<UserPointItemWithItemDto[]> {
		return UserPointItemRepositoryImpl.findAll({
			include: [PointItemRepositoryImpl],
			where: {
				userId: userId.getValue(),
				status: userStatus.getValue(),
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
		return await UserPointItemRepositoryImpl.destroy({
			where: {
				id: id.getValue(),
				userId: userId.getValue(),
				status: UserPointItemStatus.UNUSED.getValue(),
				expiredAt: { [Op.gt]: dayjs().toDate() },
			},
			limit: 1,
		})
			.then((res) => {
				if (res > 0) {
					throw Error("no item updated");
				}
				return UserPointItemRepositoryImpl.findByPk(id.getValue());
			})
			.then((repo) => (repo ? this.toDto(repo) : null));
	}

	toDto({
		id,
		userId,
		itemId,
		status,
		expiredAt,
	}: UserPointItemRepositoryImpl): UserPointItemDto {
		return new UserPointItemDto(
			new UserPointItemId(id),
			new DiscordUserId(userId),
			new PointItemId(itemId),
			new UserPointItemStatus(status),
			new UserPointItemExpire(expiredAt),
		);
	}
}

export { UserPointItemRepositoryImpl };
