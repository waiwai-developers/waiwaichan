import { RoomNotificationChannelDto } from "@/src/entities/dto/RoomNotificationChannelDto";
import { ChannelId } from "@/src/entities/vo/ChannelId";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import type { IRoomNotificationChannelRepository } from "@/src/logics/Interfaces/repositories/database/IRoomNotificationChannelRepository";
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
	tableName: "RoomNotificationChannels",
	timestamps: true,
	paranoid: true,
})
class RoomNotificationChannelRepositoryImpl
	extends Model
	implements IRoomNotificationChannelRepository
{
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.BIGINT)
	declare communityId: number;
	@Column(DataType.BIGINT)
	declare channelId: number;

	async create(data: RoomNotificationChannelDto): Promise<boolean> {
		return RoomNotificationChannelRepositoryImpl.create({
			communityId: data.communityId.getValue(),
			channelId: data.channelId.getValue(),
		}).then((res) => !!res);
	}

	async delete(communityId: CommunityId): Promise<boolean> {
		return RoomNotificationChannelRepositoryImpl.destroy({
			where: {
				communityId: communityId.getValue(),
			},
		}).then((res) => res > 0);
	}

	async findOne(
		communityId: CommunityId,
	): Promise<RoomNotificationChannelDto | undefined> {
		return RoomNotificationChannelRepositoryImpl.findOne({
			where: {
				communityId: communityId.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	toDto(): RoomNotificationChannelDto {
		return new RoomNotificationChannelDto(
			new CommunityId(this.communityId),
			new ChannelId(this.channelId),
		);
	}
}
export { RoomNotificationChannelRepositoryImpl };
