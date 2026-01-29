import { ThreadDto } from "@/src/entities/dto/ThreadDto";
import { CommunityId } from "@/src/entities/vo/CommunityId";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";
import { ThreadMetadata } from "@/src/entities/vo/ThreadMetadata";
import type { IThreadRepository } from "@/src/logics/Interfaces/repositories/database/IThreadRepository";
import { injectable } from "inversify";
import {
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@injectable()
@Table({
	tableName: "Threads",
	timestamps: true,
	paranoid: true,
})
class ThreadRepositoryImpl extends Model implements IThreadRepository {
	@PrimaryKey
	@Column(DataType.INTEGER)
	declare communityId: number;
	@PrimaryKey
	@Column(DataType.INTEGER)
	declare messageId: number;
	@Column(DataType.INTEGER)
	declare categoryType: number;
	@Column(DataType.JSON)
	declare metadata: JSON;

	async create(data: ThreadDto): Promise<boolean> {
		return ThreadRepositoryImpl.create({
			communityId: data.communityId.getValue(),
			messageId: data.messageId.getValue(),
			categoryType: data.categoryType.getValue(),
			metadata: data.metadata.getValue(),
		}).then((res) => !!res);
	}

	async findByMessageId(
		communityId: CommunityId,
		messageId: ThreadMessageId,
	): Promise<ThreadDto | undefined> {
		return ThreadRepositoryImpl.findOne({
			where: {
				communityId: communityId.getValue(),
				messageId: messageId.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	toDto(): ThreadDto {
		return new ThreadDto(
			new CommunityId(this.communityId),
			new ThreadMessageId(this.messageId),
			new ThreadCategoryType(this.categoryType),
			new ThreadMetadata(this.metadata),
		);
	}
}
export { ThreadRepositoryImpl };
