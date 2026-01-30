import { CrownNotificationChannelDto } from "@/src/entities/dto/CrownNotificationChannelDto";
import { ChannelId } from "@/src/entities/vo/ChannelId";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import type { ICrownNotificationChannelRepository } from "@/src/logics/Interfaces/repositories/database/ICrownNotificationChannelRepository";
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
	tableName: "CrownNotificationChannels",
	timestamps: true,
	paranoid: true,
})
class CrownNotificationChannelRepositoryImpl
	extends Model
	implements ICrownNotificationChannelRepository
{
	@PrimaryKey
	@AutoIncrement
	@Column(DataType.INTEGER)
	declare id: number;
	@Column(DataType.INTEGER)
	declare communityId: number;
	@Column(DataType.INTEGER)
	declare channelId: number;

	async create(data: CrownNotificationChannelDto): Promise<boolean> {
		return CrownNotificationChannelRepositoryImpl.create({
			communityId: data.communityId.getValue(),
			channelId: data.channelId.getValue(),
		}).then((res) => !!res);
	}

	async delete(communityId: CommunityId): Promise<boolean> {
		return CrownNotificationChannelRepositoryImpl.destroy({
			where: {
				communityId: communityId.getValue(),
			},
		}).then((res) => res > 0);
	}

	async findOne(
		communityId: CommunityId,
	): Promise<CrownNotificationChannelDto | undefined> {
		return CrownNotificationChannelRepositoryImpl.findOne({
			where: {
				communityId: communityId.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	toDto(): CrownNotificationChannelDto {
		return new CrownNotificationChannelDto(
			new CommunityId(this.communityId),
			new ChannelId(this.channelId),
		);
	}
}
export { CrownNotificationChannelRepositoryImpl };
