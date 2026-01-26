import { RoomCategoryChannelDto } from "@/src/entities/dto/RoomCategoryChannelDto";
import { ChannelId } from "@/src/entities/vo/ChannelId";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import type { IRoomCategoryChannelRepository } from "@/src/logics/Interfaces/repositories/database/IRoomCategoryChannelRepository";
import { injectable } from "inversify";
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
	tableName: "RoomCategoryChannels",
	timestamps: true,
	paranoid: true,
})
class RoomCategoryChannelRepositoryImpl
	extends Model
	implements IRoomCategoryChannelRepository
{
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.INTEGER)
	declare communityId: number;
	@Column(DataType.INTEGER)
	declare channelId: number;

	async create(data: RoomCategoryChannelDto): Promise<boolean> {
		return RoomCategoryChannelRepositoryImpl.create({
			communityId: data.communityId.getValue(),
			channelId: data.channelId.getValue(),
		}).then((res) => !!res);
	}

	async delete(communityId: CommunityId): Promise<boolean> {
		return RoomCategoryChannelRepositoryImpl.destroy({
			where: {
				communityId: communityId.getValue(),
			},
		}).then((res) => res > 0);
	}

	async findOne(
		communityId: CommunityId,
	): Promise<RoomCategoryChannelDto | undefined> {
		return RoomCategoryChannelRepositoryImpl.findOne({
			where: {
				communityId: communityId.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	toDto(): RoomCategoryChannelDto {
		return new RoomCategoryChannelDto(
			new CommunityId(this.communityId),
			new ChannelId(this.channelId),
		);
	}
}
export { RoomCategoryChannelRepositoryImpl };
