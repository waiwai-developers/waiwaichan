import { ReminderDto } from "@/src/entities/dto/ReminderDto";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { ReceiveDiscordUserName } from "@/src/entities/vo/ReceiveDiscordUserName";
import { RemindTime } from "@/src/entities/vo/RemindTime";
import { ReminderId } from "@/src/entities/vo/ReminderId";
import { ReminderMessage } from "@/src/entities/vo/ReminderMessage";
import { ReminderStatus } from "@/src/entities/vo/ReminderStatus";
import type { IReminderSchedulerRepository } from "@/src/logics/Interfaces/repositories/database/IReminderSchedulerRepository";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/mysqlConnector";
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
	declare receiveUserName: string;
	declare message: string;
	declare status: boolean;
	declare remindAt: Date;

	async findByRemindTime(): Promise<ReminderDto[]> {
		return ReminderSchedulerRepositoryImpl.findAll({
			where: { remindAt: { [Op.lte]: dayjs().toDate() }, status: ReminderStatus.VALID.getValue() },
		}).then((res) => res.map((r) => r.toDto()));
	}

	async updateReminder(id: ReminderId): Promise<boolean> {
		return ReminderSchedulerRepositoryImpl.update(
			{ status: ReminderStatus.INVALID.getValue() },
			{
				where: { id: id.getValue(), status: ReminderStatus.VALID.getValue() },
				limit: 1,
			},
		).then((updated) => updated[0] > 0);
	}

	toDto(): ReminderDto {
		return new ReminderDto(
			new ReminderId(this.id),
			new DiscordChannelId(this.channelId),
			new DiscordUserId(this.userId),
			new ReceiveDiscordUserName(this.receiveUserName),
			new ReminderMessage(this.message),
			new ReminderStatus(this.status),
			new RemindTime(this.remindAt),
		);
	}
}
ReminderSchedulerRepositoryImpl.init(
	{
		channelId: DataTypes.BIGINT,
		userId: DataTypes.BIGINT,
		receiveUserName: DataTypes.STRING,
		message: DataTypes.STRING,
		status: DataTypes.BOOLEAN,
		remindAt: DataTypes.DATE,
	},
	{
		sequelize,
		modelName: "Reminder",
	},
);
export { ReminderSchedulerRepositoryImpl };
