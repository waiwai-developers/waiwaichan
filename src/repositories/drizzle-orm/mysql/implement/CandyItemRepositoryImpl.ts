import { CandyItemDto } from "@/src/entities/dto/CandyItemDto";
import { CandyItemDescription } from "@/src/entities/vo/CandyItemDescription";
import { CandyItemId } from "@/src/entities/vo/CandyItemId";
import { CandyItemName } from "@/src/entities/vo/CandyItemName";
import type { ICandyItemRepository } from "@/src/logics/Interfaces/repositories/database/ICandyItemRepository";
import { eq } from "drizzle-orm";
import { injectable } from "inversify";
import { getDatabase } from "../index";
import { candyItems } from "../schema/CandyItemRepositorySchema";

/**
 * Drizzle ORM implementation of ICandyItemRepository
 * Manages candy item operations using Drizzle ORM query builder
 */
@injectable()
export class CandyItemRepositoryImpl implements ICandyItemRepository {
	/**
	 * Find a candy item by ID
	 * @param id - Candy item ID
	 * @returns Promise<CandyItemDto | undefined> - Candy item DTO or undefined if not found
	 */
	async findById(id: CandyItemId): Promise<CandyItemDto | undefined> {
		try {
			const db = getDatabase();

			const results = await db
				.select()
				.from(candyItems)
				.where(eq(candyItems.id, id.getValue()));

			if (results.length === 0) {
				return undefined;
			}

			return this.toDto(results[0]);
		} catch (error) {
			console.error("Error finding candy item by ID:", error);
			return undefined;
		}
	}

	/**
	 * Find all candy items
	 * @returns Promise<CandyItemDto[] | undefined> - Array of candy item DTOs or undefined if error
	 */
	async findAll(): Promise<CandyItemDto[] | undefined> {
		try {
			const db = getDatabase();

			const results = await db.select().from(candyItems);

			return results.map((row) => this.toDto(row));
		} catch (error) {
			console.error("Error finding all candy items:", error);
			return undefined;
		}
	}

	/**
	 * Convert database row to CandyItemDto
	 * @param row - Database row object
	 * @returns CandyItemDto
	 */
	private toDto(row: typeof candyItems.$inferSelect): CandyItemDto {
		return new CandyItemDto(
			new CandyItemId(row.id),
			new CandyItemName(row.name),
			new CandyItemDescription(row.description),
		);
	}
}
