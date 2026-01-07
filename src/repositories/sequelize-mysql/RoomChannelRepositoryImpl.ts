import { RoomChannelDto } from "@/src/entities/dto/RoomChannelDto";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
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
	@Column(DataType.STRING)
	declare guildId: string;
	@Column(DataType.STRING)
	declare channelId: string;

	async create(data: RoomChannelDto): Promise<boolean> {
		return RoomChannelRepositoryImpl.create({
			guildId: data.guildId.getValue(),
			channelId: data.channelId.getValue(),
		}).then((res) => !!res);
	}

	async findOne(data: RoomChannelDto): Promise<RoomChannelDto | undefined> {
		return RoomChannelRepositoryImpl.findOne({
			where: {
				guildId: data.guildId.getValue(),
				channelId: data.channelId.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	async delete(data: RoomChannelDto): Promise<boolean> {
		return RoomChannelRepositoryImpl.destroy({
			where: {
				guildId: data.guildId.getValue(),
				channelId: data.channelId.getValue(),
			},
		}).then((res) => res > 0);
	}

	toDto(): RoomChannelDto {
		return new RoomChannelDto(
			new DiscordGuildId(this.guildId),
			new DiscordChannelId(this.channelId),
		);
	}
}
export { RoomChannelRepositoryImpl };
