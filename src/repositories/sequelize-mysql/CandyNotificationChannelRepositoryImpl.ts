import { CandyNotificationChannelDto } from "@/src/entities/dto/CandyNotificationChannelDto";
import { ChannelId } from "@/src/entities/vo/ChannelId";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import type { ICandyNotificationChannelRepository } from "@/src/logics/Interfaces/repositories/database/ICandyNotificationChannelRepository";
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
	tableName: "CandyNotificationChannels",
	timestamps: true,
	paranoid: true,
})
class CandyNotificationChannelRepositoryImpl
	extends Model
	implements ICandyNotificationChannelRepository
{
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.INTEGER)
	declare communityId: number;
	@Column(DataType.INTEGER)
	declare channelId: number;

	async create(data: CandyNotificationChannelDto): Promise<boolean> {
		return CandyNotificationChannelRepositoryImpl.create({
			communityId: data.communityId.getValue(),
			channelId: data.channelId.getValue(),
		}).then((res) => !!res);
	}

	async delete(communityId: CommunityId): Promise<boolean> {
		return CandyNotificationChannelRepositoryImpl.destroy({
			where: {
				communityId: communityId.getValue(),
			},
		}).then((res) => res > 0);
	}

	async findOne(
		communityId: CommunityId,
	): Promise<CandyNotificationChannelDto | undefined> {
		return CandyNotificationChannelRepositoryImpl.findOne({
			where: {
				communityId: communityId.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	toDto(): CandyNotificationChannelDto {
		return new CandyNotificationChannelDto(
			new CommunityId(this.communityId),
			new ChannelId(this.channelId),
		);
	}
}
export { CandyNotificationChannelRepositoryImpl };
