import { ReminderDto } from "@/src/entities/dto/ReminderDto";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { RemindTime } from "@/src/entities/vo/RemindTime";
import { ReminderId } from "@/src/entities/vo/ReminderId";
import { ReminderMessage } from "@/src/entities/vo/ReminderMessage";
import type { IReminderRepository } from "@/src/logics/Interfaces/repositories/database/IReminderRepository";
import { injectable } from "inversify";
import { Column, Model, Table } from "sequelize-typescript";

@injectable()
@Table({
	tableName: "Reminders",
	timestamps: true,
})
class ReminderRepositoryImpl extends Model implements IReminderRepository {
	@Column
	declare id: number;
	@Column
	declare channelId: string;
	@Column
	declare userId: string;
	@Column
	declare message: string;
	@Column
	declare remindAt: Date;

	async create(data: ReminderDto): Promise<boolean> {
		return ReminderRepositoryImpl.create({
			id: data.id.getValue(),
			channelId: data.channelId.getValue(),
			userId: data.userId.getValue(),
			message: data.message.getValue(),
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
			new RemindTime(this.remindAt),
		);
	}
}
export { ReminderRepositoryImpl };
