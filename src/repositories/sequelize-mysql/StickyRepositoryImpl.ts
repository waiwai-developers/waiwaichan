import { StickyDto } from "@/src/entities/dto/StickyDto";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { StickyMessage } from "@/src/entities/vo/StickyMessage";
import { UserId } from "@/src/entities/vo/UserId";
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
	@Column(DataType.INTEGER)
	declare communityId: number;
	@Column(DataType.STRING)
	declare channelId: string;
	@Column(DataType.INTEGER)
	declare userId: number;
	@Column(DataType.STRING)
	declare messageId: string;
	@Column(DataType.STRING)
	declare message: string;

	async create(data: StickyDto): Promise<boolean> {
		return StickyRepositoryImpl.create({
			communityId : data.communityId.getValue(),
			channelId: data.channelId.getValue(),
			userId: data.userId.getValue(),
			messageId: data.messageId.getValue(),
			message: data.message.getValue(),
		}).then((res) => !!res);
	}

	async delete(
		communityId: CommunityId,
		channelId: DiscordChannelId,
	): Promise<boolean> {
		return StickyRepositoryImpl.destroy({
			where: {
				communityId : communityId.getValue(),
				channelId: channelId.getValue(),
			},
		}).then((res) => res > 0);
	}

	async updateForMessageId(
		communityId: CommunityId,
		channelId: DiscordChannelId,
		messageId: DiscordMessageId,
	): Promise<boolean> {
		return StickyRepositoryImpl.findOne({
			where: {
				communityId: communityId.getValue(),
				channelId: channelId.getValue(),
			},
		})
			.then((res) => res?.update({ messageId: messageId.getValue() }))
			.then((res) => !!res);
	}

	async findOne(
		communityId: CommunityId,
		channelId: DiscordChannelId,
	): Promise<StickyDto | undefined> {
		return StickyRepositoryImpl.findOne({
			where: {
				communityId: communityId.getValue(),
				channelId: channelId.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	toDto(): StickyDto {
		return new StickyDto(
			new CommunityId(this.communityId),
			new DiscordChannelId(this.channelId),
			new UserId(this.userId),
			new DiscordMessageId(this.messageId),
			new StickyMessage(this.message),
		);
	}
}
export { StickyRepositoryImpl };
