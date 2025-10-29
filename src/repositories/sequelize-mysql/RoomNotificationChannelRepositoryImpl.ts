import { RoomNotificationChannelDto } from "@/src/entities/dto/RoomNotificationChannelDto";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
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
class RoomNotificationChannelRepositoryImpl extends Model implements IRoomNotificationChannelRepository {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.STRING)
	declare guildId: string;
	@Column(DataType.STRING)
	declare channelId: string;

	async create(data: RoomNotificationChannelDto): Promise<boolean> {
		return RoomNotificationChannelRepositoryImpl.create({
			guildId: data.guildId.getValue(),
			channelId: data.channelId.getValue(),
		}).then((res) => !!res);
	}

	async delete(discordGuildId: DiscordGuildId): Promise<boolean> {
		return RoomNotificationChannelRepositoryImpl.destroy({
			where: {
				guildId: discordGuildId.getValue()
			},
		}).then((res) => res > 0);
	}

	async findOne(data: RoomNotificationChannelDto): Promise<RoomNotificationChannelDto | undefined> {
		return RoomNotificationChannelRepositoryImpl.findOne({
			where: {
				guildId: data.guildId.getValue(),
				channelId: data.channelId.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	toDto(): RoomNotificationChannelDto {
		return new RoomNotificationChannelDto(
			new DiscordGuildId(this.guildId),
			new DiscordChannelId(this.channelId),
		);
	}
}
export { RoomNotificationChannelRepositoryImpl };
