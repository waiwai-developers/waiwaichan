import { CrownDto } from "@/src/entities/dto/CrownDto";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import type { ICrownRepository } from "@/src/logics/Interfaces/repositories/database/ICrownRepository";
import { and, eq } from "drizzle-orm";
import { injectable } from "inversify";
import { getDatabase } from "../index";
import { crowns } from "../schema/CrownRepositorySchema";

/**
 * Drizzle ORM implementation of ICrownRepository
 * Manages crown operations using Drizzle ORM query builder
 */
@injectable()
export class CrownRepositoryImpl implements ICrownRepository {
	/**
	 * Find a crown by guild ID and message ID
	 * @param data - Crown data transfer object
	 * @returns Promise<CrownDto | undefined> - Crown DTO if found
	 */
	async findOne(data: CrownDto): Promise<CrownDto | undefined> {
		try {
			const db = getDatabase();

			const results = await db
				.select()
				.from(crowns)
				.where(
					and(
						eq(crowns.guildId, data.guildId.getValue()),
						eq(crowns.messageId, data.messageId.getValue()),
					),
				)
				.limit(1);

			if (results.length === 0) {
				return undefined;
			}

			return this.toDto(results[0]);
		} catch (error) {
			console.error("Error finding crown:", error);
			return undefined;
		}
	}

	/**
	 * Create a new crown
	 * @param data - Crown data transfer object
	 * @returns Promise<boolean> - true if created successfully
	 */
	async create(data: CrownDto): Promise<boolean> {
		try {
			const db = getDatabase();
			const now = new Date();

			await db.insert(crowns).values({
				guildId: data.guildId.getValue(),
				messageId: data.messageId.getValue(),
				createdAt: now,
				updatedAt: now,
			});

			return true;
		} catch (error) {
			console.error("Error creating crown:", error);
			return false;
		}
	}

	/**
	 * Convert database row to CrownDto
	 * @param row - Database row object
	 * @returns CrownDto
	 */
	private toDto(row: typeof crowns.$inferSelect): CrownDto {
		return new CrownDto(
			new DiscordGuildId(row.guildId),
			new DiscordMessageId(row.messageId),
		);
	}
}
