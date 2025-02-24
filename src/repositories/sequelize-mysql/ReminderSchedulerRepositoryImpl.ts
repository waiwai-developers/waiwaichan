import { ReminderDto } from "@/src/entities/dto/ReminderDto";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { ReceiveDiscordUserName } from "@/src/entities/vo/ReceiveDiscordUserName";
import { RemindTime } from "@/src/entities/vo/RemindTime";
import { ReminderDeletedAt } from "@/src/entities/vo/ReminderDeletedAt";
import { ReminderId } from "@/src/entities/vo/ReminderId";
import { ReminderMessage } from "@/src/entities/vo/ReminderMessage";
import type { IReminderSchedulerRepository } from "@/src/logics/Interfaces/repositories/database/IReminderSchedulerRepository";
import dayjs from "dayjs";
import { injectable } from "inversify";
import { Op } from "sequelize";
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
class ReminderSchedulerRepositoryImpl
	extends Model
	implements IReminderSchedulerRepository
{
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
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

	async findByRemindTime(): Promise<ReminderDto[]> {
		return ReminderSchedulerRepositoryImpl.findAll({
			where: {
				remindAt: { [Op.lte]: dayjs().toDate() },
			},
		}).then((res) => res.map((r) => r.toDto()));
	}

	async deleteReminder(id: ReminderId): Promise<boolean> {
		return ReminderSchedulerRepositoryImpl.destroy({
			where: { id: id.getValue() },
		}).then((res) => res > 0);
	}

	toDto(): ReminderDto {
		return new ReminderDto(
			new ReminderId(this.id),
			new DiscordChannelId(this.channelId),
			new DiscordUserId(this.userId),
			new ReceiveDiscordUserName(this.receiveUserName),
			new ReminderMessage(this.message),
			new RemindTime(this.remindAt),
		);
	}
}
export { ReminderSchedulerRepositoryImpl };
