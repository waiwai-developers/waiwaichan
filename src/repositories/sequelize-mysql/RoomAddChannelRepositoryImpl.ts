import { RoomAddChannelDto } from "@/src/entities/dto/RoomAddChannelDto";
import { ChannelId } from "@/src/entities/vo/ChannelId";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import type { IRoomAddChannelRepository } from "@/src/logics/Interfaces/repositories/database/IRoomAddChannelRepository";
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
	tableName: "RoomAddChannels",
	timestamps: true,
	paranoid: true,
})
class RoomAddChannelRepositoryImpl
	extends Model
	implements IRoomAddChannelRepository
{
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.INTEGER)
	declare communityId: number;
	@Column(DataType.INTEGER)
	declare channelId: number;

	async create(data: RoomAddChannelDto): Promise<boolean> {
		return RoomAddChannelRepositoryImpl.create({
			communityId: data.communityId.getValue(),
			channelId: data.channelId.getValue(),
		}).then((res) => !!res);
	}

	async delete(communityId: CommunityId): Promise<boolean> {
		return RoomAddChannelRepositoryImpl.destroy({
			where: {
				communityId: communityId.getValue(),
			},
		}).then((res) => res > 0);
	}

	async findOne(
		communityId: CommunityId,
	): Promise<RoomAddChannelDto | undefined> {
		return RoomAddChannelRepositoryImpl.findOne({
			where: {
				communityId: communityId.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	toDto(): RoomAddChannelDto {
		return new RoomAddChannelDto(
			new CommunityId(this.communityId),
			new ChannelId(this.channelId),
		);
	}
}
export { RoomAddChannelRepositoryImpl };
