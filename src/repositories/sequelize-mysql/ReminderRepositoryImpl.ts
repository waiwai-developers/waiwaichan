import { ReminderDto } from "@/src/entities/dto/ReminderDto";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { ReceiveDiscordUserName } from "@/src/entities/vo/ReceiveDiscordUserName";
import { RemindTime } from "@/src/entities/vo/RemindTime";
import { ReminderId } from "@/src/entities/vo/ReminderId";
import { ReminderMessage } from "@/src/entities/vo/ReminderMessage";
import { UserId } from "@/src/entities/vo/UserId";
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
	declare communityId: number;
	@Column(DataType.STRING)
	declare channelId: string;
	@Column(DataType.STRING)
	declare userId: number;
	@Column(DataType.STRING)
	declare receiveUserName: string;
	@Column(DataType.STRING)
	declare message: string;
	@Column(DataType.DATE)
	declare remindAt: Date;

	async create(data: ReminderDto): Promise<boolean> {
		return ReminderRepositoryImpl.create({
			communityId: data.communityId.getValue(),
			channelId: data.channelId.getValue(),
			userId: data.userId.getValue(),
			receiveUserName: data.receiveUserName.getValue(),
			message: data.message.getValue(),
			remindAt: data.remindAt.getValue(),
		}).then((res) => !!res);
	}

	async deleteReminder(
		id: ReminderId,
		communityId: CommunityId,
		userId: UserId,
	): Promise<boolean> {
		return ReminderRepositoryImpl.destroy({
			where: {
				id: id.getValue(),
				communityId: communityId.getValue(),
				userId: userId.getValue(),
			},
		}).then((res) => res > 0);
	}

	async findByUserId(
		communityId: CommunityId,
		userId: UserId,
	): Promise<ReminderDto[]> {
		return ReminderRepositoryImpl.findAll({
			where: {
				communityId: communityId.getValue(),
				userId: userId.getValue(),
			},
		}).then((res) => res.map((r) => r.toDto()));
	}

	toDto(): ReminderDto {
		return new ReminderDto(
			new ReminderId(this.id),
			new CommunityId(this.communityId),
			new DiscordChannelId(this.channelId),
			new UserId(this.userId),
			new ReceiveDiscordUserName(this.receiveUserName),
			new ReminderMessage(this.message),
			new RemindTime(this.remindAt),
		);
	}
}
export { ReminderRepositoryImpl };
