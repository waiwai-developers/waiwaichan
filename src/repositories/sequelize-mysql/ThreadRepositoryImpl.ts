import { ThreadDto } from "@/src/entities/dto/ThreadDto";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { ThreadGuildId } from "@/src/entities/vo/ThreadGuildId";
import { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";
import { ThreadMetadata } from "@/src/entities/vo/ThreadMetadata";
import type { IThreadRepository } from "@/src/logics/Interfaces/repositories/database/IThreadRepository";
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
	tableName: "Threads",
	timestamps: true,
	paranoid: true,
})
class ThreadRepositoryImpl extends Model implements IThreadRepository {
	@PrimaryKey
	@Column(DataType.STRING)
	declare guildId: string;
	@PrimaryKey
	@Column(DataType.STRING)
	declare messageId: string;
	@Column(DataType.INTEGER)
	declare categoryType: number;
	@Column(DataType.JSON)
	declare metadata: JSON;

	async create(data: ThreadDto): Promise<boolean> {
		return ThreadRepositoryImpl.create({
			guildId: data.guildId.getValue(),
			messageId: data.messageId.getValue(),
			categoryType: data.categoryType.getValue(),
			metadata: data.metadata.getValue(),
		}).then((res) => !!res);
	}

	async findByMessageId(
		guildId: ThreadGuildId,
		messageId: ThreadMessageId,
	): Promise<ThreadDto | undefined> {
		return ThreadRepositoryImpl.findOne({
			where: {
				guildId: guildId.getValue(),
				messageId: messageId.getValue(),
			},
		}).then((res) => (res ? res.toDto() : undefined));
	}

	toDto(): ThreadDto {
		return new ThreadDto(
			new ThreadGuildId(this.guildId),
			new ThreadMessageId(this.messageId),
			new ThreadCategoryType(this.categoryType),
			new ThreadMetadata(this.metadata),
		);
	}
}
export { ThreadRepositoryImpl };
