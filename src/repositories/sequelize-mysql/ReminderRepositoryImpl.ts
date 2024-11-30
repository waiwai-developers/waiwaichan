import { ReminderDto } from "@/src/entities/dto/ReminderDto";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { ReceiveDiscordUserName } from "@/src/entities/vo/ReceiveDiscordUserName";
import { RemindTime } from "@/src/entities/vo/RemindTime";
import { ReminderDeletedAt } from "@/src/entities/vo/ReminderDeletedAt";
import { ReminderId } from "@/src/entities/vo/ReminderId";
import { ReminderMessage } from "@/src/entities/vo/ReminderMessage";
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
	declare receiveUserName: string;
	declare message: string;
	declare deletedAt: Date;
	declare remindAt: Date;

	async create(
		channelId: DiscordChannelId,
		userId: DiscordUserId,
		receiveUserName: ReceiveDiscordUserName,
		message: ReminderMessage,
		remindAt: RemindTime,
	): Promise<boolean> {
		return ReminderRepositoryImpl.create({
			channelId: channelId.getValue(),
			userId: userId.getValue(),
			receiveUserName: receiveUserName.getValue(),
			message: message.getValue(),
			deletedAt: null,
			remindAt: remindAt.getValue(),
		}).then((res) => !!res);
	}

	async destoryReminder(
		id: ReminderId,
		userId: DiscordUserId,
	): Promise<boolean> {
		return ReminderRepositoryImpl.destroy({
			where: { id: id.getValue(), userID: userId.getValue() },
		}).then((res) => res > 0);
	}

	async findByUserId(userId: DiscordUserId): Promise<ReminderDto[]> {
		return ReminderRepositoryImpl.findAll({
			where: {
				userId: userId.getValue(),
				deletedAt: null,
			},
		}).then((res) => res.map((r) => r.toDto()));
	}

	toDto(): ReminderDto {
		return new ReminderDto(
			new ReminderId(this.id),
			new DiscordChannelId(this.channelId),
			new DiscordUserId(this.userId),
			new ReceiveDiscordUserName(this.receiveUserName),
			new ReminderMessage(this.message),
			new ReminderDeletedAt(this.deletedAt),
			new RemindTime(this.remindAt),
		);
	}
}
ReminderRepositoryImpl.init(
	{
		channelId: DataTypes.BIGINT,
		userId: DataTypes.BIGINT,
		receiveUserName: DataTypes.STRING,
		message: DataTypes.STRING,
		deletedAt: DataTypes.DATE,
		remindAt: DataTypes.DATE,
	},
	{
		sequelize,
		modelName: "Reminder",
		paranoid: true,
	},
);
export { ReminderRepositoryImpl };
