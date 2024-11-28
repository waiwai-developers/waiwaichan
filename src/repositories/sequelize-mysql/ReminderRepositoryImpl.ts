import { ReminderDto } from "@/src/entities/dto/ReminderDto";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { RemindTime } from "@/src/entities/vo/RemindTime";
import { ReminderId } from "@/src/entities/vo/ReminderId";
import { ReminderMessage } from "@/src/entities/vo/ReminderMessage";
import { ReceiveDiscordUserName } from "@/src/entities/vo/ReceiveDiscordUserName";
import type { IReminderRepository } from "@/src/logics/Interfaces/repositories/database/IReminderRepository";
import { MysqlConnector } from "@/src/repositories/sequelize-mysql/mysqlConnector";
import { injectable } from "inversify";
import { DataTypes, Model } from "sequelize";

const sequelize = MysqlConnector.getInstance();

@injectable()
class ReminderRepositoryImpl extends Model implements IReminderRepository {
	declare id: number;
	declare channelId: string;
	declare userId: string;
	declare message: string;
	declare receiveUserName: string;
	declare remindAt: Date;

	async create(data: ReminderDto): Promise<boolean> {
		return ReminderRepositoryImpl.create({
			id: data.id.getValue(),
			channelId: data.channelId.getValue(),
			userId: data.userId.getValue(),
			message: data.message.getValue(),
			receiveUserName: data.receiveUserName.getValue(),
			remindAt: data.remindAt.getValue(),
		}).then((res) => !!res);
	}

	async deleteReminder(
		id: ReminderId,
		userId: DiscordUserId,
	): Promise<boolean> {
		return ReminderRepositoryImpl.destroy({
			where: { id: id.getValue(), userID: userId.getValue() },
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
			new ReminderMessage(this.message),
			new ReceiveDiscordUserName(this.receiveUserName),
			new RemindTime(this.remindAt),
		);
	}
}
ReminderRepositoryImpl.init(
	{
		channelId: DataTypes.BIGINT,
		userId: DataTypes.BIGINT,
		message: DataTypes.STRING,
		receiveUserName: DataTypes.STRING,
		remindAt: DataTypes.DATE,
	},
	{
		sequelize,
		modelName: "Reminder",
	},
);
export { ReminderRepositoryImpl };
