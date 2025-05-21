import { StickyDto } from "@/src/entities/dto/StickyDto";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { StickyMessage } from "@/src/entities/vo/StickyMessage";
import type { IStickyRepository } from "@/src/logics/Interfaces/repositories/database/IStickyRepository";
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
	tableName: "Stickies",
	timestamps: true,
	paranoid: true,
})
class StickyRepositoryImpl extends Model implements IStickyRepository {
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.STRING)
	declare guildId: string;
	@Column(DataType.STRING)
	declare channelId: string;
	@Column(DataType.STRING)
	declare userId: string;
	@Column(DataType.STRING)
	declare messageId: string;
	@Column(DataType.STRING)
	declare message: string;

	async create(data: StickyDto): Promise<boolean> {
		return StickyRepositoryImpl.create({
			guildId: data.guildId.getValue(),
			channelId: data.channelId.getValue(),
			userId: data.userId.getValue(),
			messageId: data.messageId.getValue(),
			message: data.message.getValue(),
		}).then((res) => !!res);
	}

	async delete(
		guildId: DiscordGuildId,
		channelId: DiscordChannelId,
	): Promise<boolean> {
		return StickyRepositoryImpl.destroy({
			where: {
				guildId: guildId.getValue(),
				channelId: channelId.getValue(),
			},
		}).then((res) => res > 0);
	}

	async updateForMessageId(
		guildId: DiscordGuildId,
		channelId: DiscordChannelId,
		messageId: DiscordMessageId,
	): Promise<boolean> {
		return StickyRepositoryImpl.findOne({
			where: {
				guildId: guildId.getValue(),
				channelId: channelId.getValue(),
			},
		})
			.then((res) => res?.update({ messageId: messageId.getValue() }))
			.then((res) => !!res);
	}

	async updateForMessage(
		guildId: DiscordGuildId,
		channelId: DiscordChannelId,
		message: StickyMessage,
	): Promise<boolean> {
		return StickyRepositoryImpl.findOne({
			where: {
				guildId: guildId.getValue(),
				channelId: channelId.getValue(),
			},
		})
			.then((res) => res?.update({ message: message.getValue() }))
			.then((res) => !!res);
	}

	async findOne(
		guildId: DiscordGuildId,
		channelId: DiscordChannelId,
	): Promise<StickyDto | undefined> {
		return StickyRepositoryImpl.findOne({
			where: {
				guildId: guildId.getValue(),
				channelId: channelId.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	async findByCommunityId(
		guildId: DiscordGuildId,
	): Promise<StickyDto[]> {
		return StickyRepositoryImpl.findAll({
			where: {
				guildId: guildId.getValue(),
			},
		}).then((res) => (res.map((r) => r.toDto())));
	}

	toDto(): StickyDto {
		return new StickyDto(
			new DiscordGuildId(this.guildId),
			new DiscordChannelId(this.channelId),
			new DiscordUserId(this.userId),
			new DiscordMessageId(this.messageId),
			new StickyMessage(this.message),
		);
	}
}
export { StickyRepositoryImpl };
