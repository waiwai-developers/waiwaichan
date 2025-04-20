import { ReminderDto } from "@/src/entities/dto/ReminderDto";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { ReceiveDiscordUserName } from "@/src/entities/vo/ReceiveDiscordUserName";
import { RemindTime } from "@/src/entities/vo/RemindTime";
import { ReminderId } from "@/src/entities/vo/ReminderId";
import { ReminderMessage } from "@/src/entities/vo/ReminderMessage";
import type { IReminderRepository } from "@/src/logics/Interfaces/repositories/database/IReminderRepository";
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
	tableName: "Reminders",
	timestamps: true,
	paranoid: true,
})
class ReminderRepositoryImpl extends Model implements IReminderRepository {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.INTEGER)
	declare guildId: string;
	@Column(DataType.STRING)
	declare channelId: string;
	@Column(DataType.STRING)
	declare userId: string;
	@Column(DataType.STRING)
	declare receiveUserName: string;
	@Column(DataType.STRING)
	declare message: string;
	@Column(DataType.DATE)
	declare remindAt: Date;

	async create(data: ReminderDto): Promise<boolean> {
		return ReminderRepositoryImpl.create({
			guildId: data.guildId.getValue(),
			channelId: data.channelId.getValue(),
			userId: data.userId.getValue(),
			receiveUserName: data.receiveUserName.getValue(),
			message: data.message.getValue(),
			remindAt: data.remindAt.getValue(),
		}).then((res) => !!res);
	}

	async deleteReminder(
		id: ReminderId,
		guildId: DiscordUserId,
		userId: DiscordUserId,
	): Promise<boolean> {
		return ReminderRepositoryImpl.destroy({
			where: { id: id.getValue(), guildId: guildId.getValue(), userId: userId.getValue() },
		}).then((res) => res > 0);
	}

	async findByUserId(guildId: DiscordGuildId, userId: DiscordUserId): Promise<ReminderDto[]> {
		return ReminderRepositoryImpl.findAll({
			where: {
				guildId: guildId.getValue(),
				userId: userId.getValue(),
			},
		}).then((res) => res.map((r) => r.toDto()));
	}

	toDto(): ReminderDto {
		return new ReminderDto(
			new ReminderId(this.id),
			new DiscordGuildId(this.guildId),
			new DiscordChannelId(this.channelId),
			new DiscordUserId(this.userId),
			new ReceiveDiscordUserName(this.receiveUserName),
			new ReminderMessage(this.message),
			new RemindTime(this.remindAt),
		);
	}
}
export { ReminderRepositoryImpl };
