import { StickyDto } from "@/src/entities/dto/StickyDto";
import { ChannelId } from "@/src/entities/vo/ChannelId";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import { MessageId } from "@/src/entities/vo/MessageId";
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
	@Column(DataType.INTEGER)
	declare channelId: number;
	@Column(DataType.INTEGER)
	declare userId: number;
	@Column(DataType.INTEGER)
	declare messageId: number;
	@Column(DataType.STRING)
	declare message: string;

	async create(data: StickyDto): Promise<boolean> {
		return StickyRepositoryImpl.create({
			communityId: data.communityId.getValue(),
			channelId: data.channelId.getValue(),
			userId: data.userId.getValue(),
			messageId: data.messageId.getValue(),
			message: data.message.getValue(),
		}).then((res) => !!res);
	}

	async delete(
		communityId: CommunityId,
		channelId: ChannelId,
	): Promise<boolean> {
		return StickyRepositoryImpl.destroy({
			where: {
				communityId: communityId.getValue(),
				channelId: channelId.getValue(),
			},
		}).then((res) => res > 0);
	}

	async updateForMessageId(
		communityId: CommunityId,
		channelId: ChannelId,
		messageId: MessageId,
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

	async updateForMessage(
		communityId: CommunityId,
		channelId: ChannelId,
		message: StickyMessage,
	): Promise<boolean> {
		return StickyRepositoryImpl.findOne({
			where: {
				communityId: communityId.getValue(),
				channelId: channelId.getValue(),
			},
		})
			.then((res) => res?.update({ message: message.getValue() }))
			.then((res) => !!res);
	}

	async findOne(
		communityId: CommunityId,
		channelId: ChannelId,
	): Promise<StickyDto | undefined> {
		return StickyRepositoryImpl.findOne({
			where: {
				communityId: communityId.getValue(),
				channelId: channelId.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	async findByCommunityId(communityId: CommunityId): Promise<StickyDto[]> {
		return StickyRepositoryImpl.findAll({
			where: {
				communityId: communityId.getValue(),
			},
		}).then((res) => res.map((r) => r.toDto()));
	}

	toDto(): StickyDto {
		return new StickyDto(
			new CommunityId(this.communityId),
			new ChannelId(this.channelId),
			new UserId(this.userId),
			new MessageId(this.messageId),
			new StickyMessage(this.message),
		);
	}
}
export { StickyRepositoryImpl };
