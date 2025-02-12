import { ShiritoriWordDto } from "@/src/entities/dto/ShiritoriWordDto";
import { ShiritoriWordGuildId } from "@/src/entities/vo/ShiritoriWordGuildId";
import { ShiritoriWordMessageId } from "@/src/entities/vo/ShiritoriWordMessageId";
import { ShiritoriWordNextMessageId } from "@/src/entities/vo/ShiritoriWordNextMessageId";
import { ShiritoriWordReadingWord } from "@/src/entities/vo/ShiritoriWordReadingWord";
import { ShiritoriWordThreadId } from "@/src/entities/vo/ShiritoriWordThreadId";
import { ShiritoriWordUserId } from "@/src/entities/vo/ShiritoriWordUserId";
import { ShiritoriWordWritingWord } from "@/src/entities/vo/ShiritoriWordWritingWord";
import type { IShiritoriWordRepository } from "@/src/logics/Interfaces/repositories/database/IShiritoriWorkRepository";
import { injectable } from "inversify";
import { col } from "sequelize";
import {
	Column,
	DataType,
	Model,
	PrimaryKey,
	Table,
} from "sequelize-typescript";

@injectable()
@Table({
	tableName: "ShiritoriWords",
	timestamps: true,
	paranoid: true,
})
class ShiritoriWordRepositoryImpl
	extends Model
	implements IShiritoriWordRepository
{
	@Column(DataType.BIGINT)
	declare userId: number;
	@PrimaryKey
	@Column(DataType.BIGINT)
	declare guildId: number;
	@Column(DataType.BIGINT)
	declare threadId: number;
	@PrimaryKey
	@Column(DataType.BIGINT)
	declare messageId: number;
	@Column(DataType.STRING)
	declare readingWord: string;
	@Column(DataType.STRING)
	declare writingWord: string;
	@Column(DataType.BIGINT)
	declare nextMessageId: number;

	async createWord(data: ShiritoriWordDto): Promise<ShiritoriWordDto | undefined> {
		return ShiritoriWordRepositoryImpl.create({
			userId: data.userId.getValue(),
			guildId: data.guildId.getValue(),
			threadId: data.threadId.getValue(),
			messageId: data.messageId.getValue(),
			readingWord: data.readingWord.getValue(),
			writingWord: data.messageId.getValue(),
		}).then((res) => (res ? res.toDto() : undefined));
	}

	async updateWord(
		guildId: ShiritoriWordGuildId,
		messageId: ShiritoriWordMessageId,
		readingWord: ShiritoriWordReadingWord,
		writingWord: ShiritoriWordWritingWord,
	): Promise<boolean> {
		return ShiritoriWordRepositoryImpl.update(
			{
				readingWord: readingWord.getValue(),
				writingWord: writingWord.getValue(),
			},
			{
				where: {
					guildId: guildId.getValue(),
					threadId: messageId.getValue(),
				},
			},
		).then((res) => !!res );
	}

	async updateBackWord(
		guildId: ShiritoriWordGuildId,
		messageId: ShiritoriWordMessageId,
		nextMessageId: ShiritoriWordNextMessageId,
	): Promise<boolean> {
		return ShiritoriWordRepositoryImpl.update(
			{
				nextMessageId: nextMessageId.getValue(),
			},
			{
				where: {
					guildId: guildId.getValue(),
					threadId: messageId.getValue(),
				},
			},
		).then((res) => !!res );
	}

	async deleteWord(
		guildId: ShiritoriWordGuildId,
		messageId: ShiritoriWordMessageId,
	): Promise<boolean> {
		return ShiritoriWordRepositoryImpl.destroy({
			where: {
				guildId: guildId.getValue(),
				messageId: messageId.getValue(),
				nextMessageId: null,
			},
		}).then((res) => !!res);
	}

	async findThreadLatestWord(
		guildId: ShiritoriWordGuildId,
		threadId: ShiritoriWordThreadId,
	): Promise<ShiritoriWordDto | undefined> {
		return ShiritoriWordRepositoryImpl.findOne({
			where: {
				guildId: guildId.getValue(),
				threadId: threadId.getValue(),
			},
			order: [[col("messageId"), "DESC"]],
		}).then((res) => res ? res.toDto() : undefined);
	}

	toDto(): ShiritoriWordDto {
		return new ShiritoriWordDto(
			new ShiritoriWordUserId(this.userId),
			new ShiritoriWordGuildId(this.guildId),
			new ShiritoriWordThreadId(this.threadId),
			new ShiritoriWordMessageId(this.messageId),
			new ShiritoriWordReadingWord(this.readingWord),
			new ShiritoriWordWritingWord(this.writingWord),
			new ShiritoriWordNextMessageId(this.nextMessageId),
		);
	}
}
export { ShiritoriWordRepositoryImpl };
