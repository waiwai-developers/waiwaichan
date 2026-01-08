import { ThreadDto } from "@/src/entities/dto/ThreadDto";
import { ThreadCategoryType } from "@/src/entities/vo/ThreadCategoryType";
import { ThreadGuildId } from "@/src/entities/vo/ThreadGuildId";
import { ThreadMessageId } from "@/src/entities/vo/ThreadMessageId";
import { ThreadMetadata } from "@/src/entities/vo/ThreadMetadata";
import type { IThreadRepository } from "@/src/logics/Interfaces/repositories/database/IThreadRepository";
import { and, eq, isNull } from "drizzle-orm";
import { injectable } from "inversify";
import { getDatabase } from "../index";
import { threads } from "../schema/ThreadRepositorySchema";

/**
 * Drizzle ORM implementation of IThreadRepository
 * Manages thread operations using Drizzle ORM query builder
 */
@injectable()
export class ThreadRepositoryImpl implements IThreadRepository {
	/**
	 * Create a new thread
	 * @param data - Thread data transfer object
	 * @returns Promise<boolean> - true if created successfully
	 */
	async create(data: ThreadDto): Promise<boolean> {
		try {
			const db = getDatabase();
			const now = new Date();

			const guildIdValue = data.guildId.getValue();
			const messageIdValue = data.messageId.getValue();

			if (guildIdValue === null || messageIdValue === null) {
				console.error("Error creating thread: guildId and messageId cannot be null");
				return false;
			}

			await db.insert(threads).values({
				guildId: guildIdValue,
				messageId: messageIdValue,
				categoryType: data.categoryType.getValue(),
				metadata: data.metadata.getValue(),
				createdAt: now,
				updatedAt: now,
			});

			return true;
		} catch (error) {
			console.error("Error creating thread:", error);
			return false;
		}
	}

	/**
	 * Find a thread by guild ID and message ID
	 * @param guildId - Thread guild ID
	 * @param messageId - Thread message ID
	 * @returns Promise<ThreadDto | undefined> - Thread DTO or undefined if not found
	 */
	async findByMessageId(
		guildId: ThreadGuildId,
		messageId: ThreadMessageId,
	): Promise<ThreadDto | undefined> {
		try {
			const db = getDatabase();

			const guildIdValue = guildId.getValue();
			const messageIdValue = messageId.getValue();

			if (guildIdValue === null || messageIdValue === null) {
				return undefined;
			}

			const results = await db
				.select()
				.from(threads)
				.where(
					and(
						eq(threads.guildId, guildIdValue),
						eq(threads.messageId, messageIdValue),
						isNull(threads.deletedAt),
					),
				)
				.limit(1);

			if (results.length === 0) {
				return undefined;
			}

			return this.toDto(results[0]);
		} catch (error) {
			console.error("Error finding thread by message ID:", error);
			return undefined;
		}
	}

	/**
	 * Convert database row to ThreadDto
	 * @param row - Database row object
	 * @returns ThreadDto
	 */
	private toDto(row: typeof threads.$inferSelect): ThreadDto {
		return new ThreadDto(
			new ThreadGuildId(row.guildId),
			new ThreadMessageId(row.messageId),
			new ThreadCategoryType(row.categoryType),
			new ThreadMetadata(row.metadata as JSON),
		);
	}
}
