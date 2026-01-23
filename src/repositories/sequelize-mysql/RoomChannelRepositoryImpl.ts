import { RoomChannelDto } from "@/src/entities/dto/RoomChannelDto";
import { ChannelId } from "@/src/entities/vo/ChannelId";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import type { IRoomChannelRepository } from "@/src/logics/Interfaces/repositories/database/IRoomChannelRepository";
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
	tableName: "RoomChannels",
	timestamps: true,
	paranoid: true,
})
class RoomChannelRepositoryImpl
	extends Model
	implements IRoomChannelRepository
{
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.INTEGER)
	declare communityId: number;
	@Column(DataType.INTEGER)
	declare channelId: number;

	async create(data: RoomChannelDto): Promise<boolean> {
		return RoomChannelRepositoryImpl.create({
			communityId: data.communityId.getValue(),
			channelId: data.channelId.getValue(),
		}).then((res) => !!res);
	}

	async findOne(data: RoomChannelDto): Promise<RoomChannelDto | undefined> {
		return RoomChannelRepositoryImpl.findOne({
			where: {
				communityId: data.communityId.getValue(),
				channelId: data.channelId.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	async delete(data: RoomChannelDto): Promise<boolean> {
		return RoomChannelRepositoryImpl.destroy({
			where: {
				communityId: data.communityId.getValue(),
				channelId: data.channelId.getValue(),
			},
		}).then((res) => res > 0);
	}

	toDto(): RoomChannelDto {
		return new RoomChannelDto(
			new CommunityId(this.communityId),
			new ChannelId(this.channelId),
		);
	}
}
export { RoomChannelRepositoryImpl };
