import { ReminderDto } from "@/entities/dto/ReminderDto";
import { DiscordChannelId } from "@/entities/vo/DiscordChannelId";
import { DiscordMessageId } from "@/entities/vo/DiscordMessageId";
import { DiscordUserId } from "@/entities/vo/DiscordUserId";
import { RemindTime } from "@/entities/vo/RemindTime";
import { ReminderId } from "@/entities/vo/ReminderId";
import type { IReminderRepository } from "@/logics/Interfaces/repository/IReminderRepository";
import { MysqlConnector } from "@/repositories/sequelize-mysql/mysqlConnector";
import { DataTypes, Model } from "sequelize";

const sequelize = MysqlConnector.getInstance();

class ReminderRepositoryImpl extends Model implements IReminderRepository {
	declare id: number;
	declare channelId: string;
	declare userId: string;
	declare message: string;
	declare remindAt: Date;

	async create(data: ReminderDto): Promise<boolean> {
		return ReminderRepositoryImpl.create({
			id: data.id.getValue(),
			channelId: data.channelId.getValue(),
			userId: data.userId.getValue(),
			messageId: data.messageId.getValue(),
			remindAt: data.remindAt.getValue(),
		}).then((res) => !!res);
	}

	async deleteReminder(id: ReminderId): Promise<boolean> {
		return ReminderRepositoryImpl.destroy({
			where: {},
		}).then((res) => res > 0);
	}

	async findByUserId(userId: DiscordUserId): Promise<ReminderDto[]> {
		return ReminderRepositoryImpl.findAll({
			where: { userId: userId.getValue() },
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
ReminderRepositoryImpl.init(
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
export { ReminderRepositoryImpl };
