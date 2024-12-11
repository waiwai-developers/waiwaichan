import { ThreadDto } from "@/src/entities/dto/ThreadDto";
import { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { IThreadRepository } from "@/src/logics/Interfaces/repositories/database/IThreadRepository";
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
	@AutoIncrement
	@Column(DataType.STRING)
	declare messageId: string;
	@Column(DataType.INTEGER)
	declare categoryType: number;

	async create(data: ThreadDto): Promise<boolean> {
		return ThreadRepositoryImpl.create({
			messageId: data.messageId.getValue(),
			categoryType: data.categoryType.getValue(),
		}).then((res) => !!res);
	}

	async findByMessageId(messageId: ThreadMessageId): Promise<ThreadDto | undefined> {
		return ThreadRepositoryImpl.findOne({
			where: {
				messageId: messageId.getValue(),
			},
		}).then((res) => res ? res.toDto() : undefined);
	}

	toDto(): ThreadDto {
		return new ThreadDto(
			new ThreadMessageId(this.messageId),
			new ThreadCategoryType(this.categoryType),
		);
	}
}
export { ThreadRepositoryImpl };
