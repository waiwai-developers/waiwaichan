import { PersonalityDto } from "@/src/entities/dto/PersonalityDto";
import { PersonalityId } from "@/src/entities/vo/PersonalityId";
import { PersonalityName } from "@/src/entities/vo/PersonalityName";
import { PersonalityPrompt } from "@/src/entities/vo/PersonalityPrompt";
import type { IPersonalityRepository } from "@/src/logics/Interfaces/repositories/database/IPersonalityRepository";
import { eq } from "drizzle-orm";
import { injectable } from "inversify";
import { getDatabase } from "../index";
import { personalities } from "../schema/PersonalityRepositorySchema";

/**
 * Drizzle ORM implementation of IPersonalityRepository
 * Manages personality operations using Drizzle ORM query builder
 */
@injectable()
export class PersonalityRepositoryImpl implements IPersonalityRepository {
	/**
	 * Find a personality by ID
	 * @param id - Personality ID
	 * @returns Promise<PersonalityDto | undefined> - Personality DTO or undefined if not found
	 */
	async findById(id: PersonalityId): Promise<PersonalityDto | undefined> {
		try {
			const db = getDatabase();

			const results = await db
				.select()
				.from(personalities)
				.where(eq(personalities.id, id.getValue()))
				.limit(1);

			if (results.length === 0) {
				return undefined;
			}

			return this.toDto(results[0]);
		} catch (error) {
			console.error("Error finding personality by ID:", error);
			return undefined;
		}
	}

	/**
	 * Convert database row to PersonalityDto
	 * @param row - Database row object
	 * @returns PersonalityDto
	 */
	private toDto(row: typeof personalities.$inferSelect): PersonalityDto {
		return new PersonalityDto(
			new PersonalityId(row.id),
			new PersonalityName(row.name),
			new PersonalityPrompt(row.prompt as JSON),
		);
	}
}
