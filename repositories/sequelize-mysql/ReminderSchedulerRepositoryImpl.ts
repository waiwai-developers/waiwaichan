import { ReminderDto } from "@/entities/dto/ReminderDto";
import { DiscordChannelId } from "@/entities/vo/DiscordChannelId";
import { DiscordUserId } from "@/entities/vo/DiscordUserId";
import { RemindTime } from "@/entities/vo/RemindTime";
import { ReminderId } from "@/entities/vo/ReminderId";
import { ReminderMessage } from "@/entities/vo/ReminderMessage";
import type { IReminderSchedulerRepository } from "@/logics/Interfaces/repositories/database/IReminderSchedulerRepository";
import { MysqlConnector } from "@/repositories/sequelize-mysql/mysqlConnector";
import dayjs from "dayjs";
import { injectable } from "inversify";
import { DataTypes, Model, Op } from "sequelize";

const sequelize = MysqlConnector.getInstance();

@injectable()
class ReminderSchedulerRepositoryImpl
	extends Model
	implements IReminderSchedulerRepository
{
	declare id: number;
	declare channelId: string;
	declare userId: string;
	declare message: string;
	declare remindAt: Date;

	async findByRemindTime(): Promise<ReminderDto[]> {
		return ReminderSchedulerRepositoryImpl.findAll({
			where: { remindAt: { [Op.lte]: dayjs().toDate() } },
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
			new ReminderMessage(this.message),
			new RemindTime(this.remindAt),
		);
	}
}
ReminderSchedulerRepositoryImpl.init(
	{
		channelId: DataTypes.BIGINT,
		userId: DataTypes.BIGINT,
		message: DataTypes.STRING,
		remindAt: DataTypes.DATE,
	},
	{
		sequelize,
		modelName: "Reminder",
	},
);
export { ReminderSchedulerRepositoryImpl };
