import { UserPointItemDto } from "@/src/entities/dto/UserPointItemDto";
import type { UserPointItemWithItemDto } from "@/src/entities/dto/UserPointItemWithItemDto";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { PointItemId } from "@/src/entities/vo/PointItemId";
import { PointItemName } from "@/src/entities/vo/PointItemName";
import { UserPointItemExpire } from "@/src/entities/vo/UserPointItemExpire";
import { UserPointItemId } from "@/src/entities/vo/UserPointItemId";
import { UserPointItemStatus } from "@/src/entities/vo/UserPointItemStatus";
import type { IUserPointItemRepository } from "@/src/logics/Interfaces/repositories/database/IUserPointItemRepository";
import dayjs from "dayjs";
import { injectable } from "inversify";
import Sequelize, { DataTypes, Model } from "sequelize";
import { PointItemRepositoryImpl } from "./PointItemRepositoryImpl";
import { MysqlConnector } from "./mysqlConnector";
const sequelize = MysqlConnector.getInstance();

@injectable()
class UserPointItemRepositoryImpl
	extends Model
	implements IUserPointItemRepository
{
	declare id: number;
	declare userId: string;
	declare itemId: number;
	declare status: boolean;
	declare expiredAt: Date;
	declare dataValues: {
		item: {
			name: string;
			description: string;
		};
	};

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
			include: { model: PointItemRepositoryImpl, as: "item" },
			where: {
				userId: userId.getValue(),
				status: userStatus.getValue(),
				expiredAt: { [Sequelize.Op.gte]: dayjs().toDate() },
			},
		}).then((r) =>
			r.map((it) => {
				return {
					...this.toDto(it),
					name: new PointItemName(it.dataValues.item.name),
					description: new PointItemName(it.dataValues.item.description),
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
		return await UserPointItemRepositoryImpl.update(
			{ status: UserPointItemStatus.USED.getValue() },
			{
				where: {
					id: id.getValue(),
					userId: userId.getValue(),
					status: UserPointItemStatus.UNUSED.getValue(),
					expiredAt: { [Sequelize.Op.gte]: dayjs().toDate() },
				},
				limit: 1,
			},
		)
			.then((updated) => {
				if (updated[0] <= 0) {
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
UserPointItemRepositoryImpl.init(
	{
		userId: DataTypes.BIGINT,
		itemId: DataTypes.INTEGER,
		status: DataTypes.BOOLEAN,
		expiredAt: DataTypes.DATE,
	},
	{
		sequelize,
		modelName: "UserItem",
	},
);

export { UserPointItemRepositoryImpl };