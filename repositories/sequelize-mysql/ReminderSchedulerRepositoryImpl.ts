import { ReminderDto } from "@/entities/dto/ReminderDto";
import { DiscordChannelId } from "@/entities/vo/DiscordChannelId";
import { DiscordMessageId } from "@/entities/vo/DiscordMessageId";
import { DiscordUserId } from "@/entities/vo/DiscordUserId";
import { RemindTime } from "@/entities/vo/RemindTime";
import { ReminderId } from "@/entities/vo/ReminderId";
import type { IReminderRepository } from "@/logics/Interfaces/repository/sequelize-mysql/IReminderRepository";
import type { IReminderSchedulerRepository } from "@/logics/Interfaces/repository/sequelize-mysql/IReminderSchedulerRepository";
import { MysqlConnector } from "@/repositories/sequelize-mysql/mysqlConnector";
import dayjs from "dayjs";
import { DataTypes, Model, Op } from "sequelize";

const sequelize = MysqlConnector.getInstance();

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

	toDto(): ReminderDto {
		return new ReminderDto(
			new ReminderId(this.id),
			new DiscordChannelId(this.channelId),
			new DiscordUserId(this.userId),
			new DiscordMessageId(this.message),
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
