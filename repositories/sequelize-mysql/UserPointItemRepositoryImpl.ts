import { UserPointItemDto } from "@/entities/dto/UserPointItemDto";
import { DiscordUserId } from "@/entities/vo/DiscordUserId";
import { PointItemId } from "@/entities/vo/PointItemId";
import { UserPointItemExpire } from "@/entities/vo/UserPointItemExpire";
import { UserPointItemId } from "@/entities/vo/UserPointItemId";
import { UserPointItemStatus } from "@/entities/vo/UserPointItemStatus";
import type { IUserPointItemRepository } from "@/logics/Interfaces/repositories/database/IUserPointItemRepository";
import dayjs from "dayjs";
import Sequelize, { DataTypes, Model } from "sequelize";
import { PointItemRepositoryImpl } from "./PointItemRepositoryImpl";
import { MysqlConnector } from "./mysqlConnector";
const sequelize = MysqlConnector.getInstance().db;

class UserPointItemRepositoryImpl
	extends Model
	implements IUserPointItemRepository
{
	declare id: number;
	declare userId: string;
	declare itemId: number;
	declare status: boolean;
	declare expiredAt: Date;

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
	): Promise<UserPointItemDto[]> {
		return UserPointItemRepositoryImpl.findAll({
			include: { model: PointItemRepositoryImpl, as: "item" },
			where: {
				userId: userId.getValue(),
				status: userStatus.getValue(),
				expiredAt: { [Sequelize.Op.gte]: dayjs().toDate() },
			},
		}).then((r) => r.map((it) => this.toDto(it)));
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
			{ status: UserPointItemStatus.USED },
			{
				where: {
					id: id.getValue(),
					userId: userId.getValue(),
					status: UserPointItemStatus.UNUSED,
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
