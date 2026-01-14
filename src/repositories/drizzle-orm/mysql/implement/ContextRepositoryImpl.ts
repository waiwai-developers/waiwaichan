import { ContextDto } from "@/src/entities/dto/ContextDto";
import type { ContextId } from "@/src/entities/vo/ContextId";
import { ContextName } from "@/src/entities/vo/ContextName";
import { ContextPrompt } from "@/src/entities/vo/ContextPrompt";
import type { IContextRepository } from "@/src/logics/Interfaces/repositories/database/IContextRepository";
import { eq } from "drizzle-orm";
import { injectable } from "inversify";
import { getDatabase } from "../index";
import { contexts } from "../schema/ContextRepositorySchema";

/**
 * Drizzle ORM implementation of IContextRepository
 * Manages context operations using Drizzle ORM query builder
 */
@injectable()
export class ContextRepositoryImpl implements IContextRepository {
	/**
	 * Find a context by ID
	 * @param id - Context ID
	 * @returns Promise<ContextDto | undefined> - Context DTO or undefined if not found
	 */
	async findById(id: ContextId): Promise<ContextDto | undefined> {
		try {
			const db = getDatabase();

			const results = await db
				.select()
				.from(contexts)
				.where(eq(contexts.id, id.getValue()))
				.limit(1);

			if (results.length === 0) {
				return undefined;
			}

			return this.toDto(results[0]);
		} catch (error) {
			console.error("Error finding context by ID:", error);
			return undefined;
		}
	}

	/**
	 * Convert database row to ContextDto
	 * @param row - Database row object
	 * @returns ContextDto
	 */
	private toDto(row: typeof contexts.$inferSelect): ContextDto {
		return new ContextDto(
			new ContextName(row.name),
			new ContextPrompt(row.prompt as JSON),
		);
	}
}
