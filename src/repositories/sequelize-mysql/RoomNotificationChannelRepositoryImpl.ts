import { RoomNotificationChannelDto } from "@/src/entities/dto/RoomNotificationChannelDto";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
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
	@Column(DataType.STRING)
	declare channelId: string;

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
			new DiscordChannelId(this.channelId),
		);
	}
}
export { RoomNotificationChannelRepositoryImpl };
