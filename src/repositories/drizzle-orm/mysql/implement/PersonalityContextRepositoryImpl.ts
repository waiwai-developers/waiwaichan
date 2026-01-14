import { PersonalityContextDto } from "@/src/entities/dto/PersonalityContextDto";
import { PersonalityContextContextId } from "@/src/entities/vo/PersonalityContextContextId";
import { PersonalityContextPersonalityId } from "@/src/entities/vo/PersonalityContextPersonalityId";
import type { IPersonalityContextRepository } from "@/src/logics/Interfaces/repositories/database/IPersonalityContextRepository";
import { and, eq } from "drizzle-orm";
import { injectable } from "inversify";
import { getDatabase } from "../index";
import { personalityContexts } from "../schema/PersonalityContextRepositorySchema";

/**
 * Drizzle ORM implementation of IPersonalityContextRepository
 * Manages personality-context relationship operations using Drizzle ORM query builder
 */
@injectable()
export class PersonalityContextRepositoryImpl
	implements IPersonalityContextRepository
{
	/**
	 * Find a personality-context relationship by personality ID and context ID
	 * @param personalityId - Personality ID
	 * @param contextId - Context ID
	 * @returns Promise<PersonalityContextDto | undefined> - Personality context DTO if found
	 */
	async findBypersonalityIdAndcontextId(
		personalityId: PersonalityContextPersonalityId,
		contextId: PersonalityContextContextId,
	): Promise<PersonalityContextDto | undefined> {
		try {
			const db = getDatabase();

			const results = await db
				.select()
				.from(personalityContexts)
				.where(
					and(
						eq(personalityContexts.personalityId, personalityId.getValue()),
						eq(personalityContexts.contextId, contextId.getValue()),
					),
				)
				.limit(1);

			if (results.length === 0) {
				return undefined;
			}

			return this.toDto(results[0]);
		} catch (error) {
			console.error(
				"Error finding personality context by personality ID and context ID:",
				error,
			);
			return undefined;
		}
	}

	/**
	 * Convert database row to PersonalityContextDto
	 * @param row - Database row object
	 * @returns PersonalityContextDto
	 */
	private toDto(
		row: typeof personalityContexts.$inferSelect,
	): PersonalityContextDto {
		return new PersonalityContextDto(
			new PersonalityContextPersonalityId(row.personalityId),
			new PersonalityContextContextId(row.contextId),
		);
	}
}
