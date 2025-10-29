import { RoomAddChannelDto } from "@/src/entities/dto/RoomAddChannelDto";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
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
	tableName: "Stickies",
	timestamps: true,
	paranoid: true,
})
class RoomAddChannelRepositoryImpl extends Model implements IRoomAddChannelRepository {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.STRING)
	declare guildId: string;
	@Column(DataType.STRING)
	declare channelId: string;

	async create(data: RoomAddChannelDto): Promise<boolean> {
		return RoomAddChannelRepositoryImpl.create({
			guildId: data.guildId.getValue(),
			channelId: data.channelId.getValue(),
		}).then((res) => !!res);
	}

	async delete(data: RoomAddChannelDto): Promise<boolean> {
		return RoomAddChannelRepositoryImpl.destroy({
			where: {
				guildId: data.guildId.getValue(),
				channelId: data.channelId.getValue(),
			},
		}).then((res) => res > 0);
	}

	async findOne(data: RoomAddChannelDto): Promise<RoomAddChannelDto | undefined> {
		return RoomAddChannelRepositoryImpl.findOne({
			where: {
				guildId: data.guildId.getValue(),
				channelId: data.channelId.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	toDto(): RoomAddChannelDto {
		return new RoomAddChannelDto(
			new DiscordGuildId(this.guildId),
			new DiscordChannelId(this.channelId),
		);
	}
}
export { RoomAddChannelRepositoryImpl };
