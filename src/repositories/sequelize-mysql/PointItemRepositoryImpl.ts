import { PointItemDto } from "@/src/entities/dto/PointItemDto";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { PointItemDescription } from "@/src/entities/vo/PointItemDescription";
import { PointItemId } from "@/src/entities/vo/PointItemId";
import { PointItemName } from "@/src/entities/vo/PointItemName";
import type { IPointItemRepository } from "@/src/logics/Interfaces/repositories/database/IPointItemRepository";
import { injectable } from "inversify";
import { DataTypes, Model } from "sequelize";
import { MysqlConnector } from "./mysqlConnector";

const sequelize = MysqlConnector.getInstance();

@injectable()
class PointItemRepositoryImpl extends Model implements IPointItemRepository {
	declare id: number;
	declare userId: string;
	declare name: string;
	declare description: string;
	async findById(id: PointItemId): Promise<PointItemDto | undefined> {
		return await PointItemRepositoryImpl.findOne({
			where: { id: id.getValue() },
		}).then((r) =>
			r ? this.toDto(r.id, r.userId, r.name, r.description) : undefined,
		);
	}

	toDto(
		id: number,
		discordUserId: string,
		name: string,
		description: string,
	): PointItemDto {
		return new PointItemDto(
			new PointItemId(id),
			new DiscordUserId(discordUserId),
			new PointItemName(name),
			new PointItemDescription(description),
		);
	}
}

PointItemRepositoryImpl.init(
	{
		name: DataTypes.STRING,
		description: DataTypes.STRING,
	},
	{
		sequelize,
		modelName: "Item",
	},
);

export { PointItemRepositoryImpl };