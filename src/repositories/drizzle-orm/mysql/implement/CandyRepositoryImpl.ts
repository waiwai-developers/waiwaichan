import { CandyDto } from "@/src/entities/dto/CandyDto";
import { CandyCategoryType } from "@/src/entities/vo/CandyCategoryType";
import { CandyCount } from "@/src/entities/vo/CandyCount";
import type { CandyCreatedAt } from "@/src/entities/vo/CandyCreatedAt";
import { CandyExpire } from "@/src/entities/vo/CandyExpire";
import { CandyId } from "@/src/entities/vo/CandyId";
import type { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import type { ICandyRepository } from "@/src/logics/Interfaces/repositories/database/ICandyRepository";
import dayjs from "dayjs";
import { and, asc, count, eq, gt, isNotNull, isNull, sql } from "drizzle-orm";
import { injectable } from "inversify";
import { getDatabase } from "../index";
import { candies } from "../schema/CandyRepositorySchema";

/**
 * Drizzle ORM implementation of ICandyRepository
 * Manages candy operations using Drizzle ORM query builder
 */
@injectable()
export class CandyRepositoryImpl implements ICandyRepository {
	/**
	 * Bulk create candies
	 * @param data - Array of Candy data transfer objects
	 * @returns Promise<boolean> - true if created successfully
	 */
	async bulkCreateCandy(data: CandyDto[]): Promise<boolean> {
		try {
			const db = getDatabase();
			const now = new Date();

			await db.insert(candies).values(
				data.map((d) => ({
					guildId: d.guildId.getValue(),
					receiveUserId: d.receiveUserId.getValue(),
					giveUserId: d.giveUserId.getValue(),
					messageId: d.messageId.getValue(),
					categoryType: d.categoryType.getValue(),
					expiredAt: d.expiredAt.getValue(),
					createdAt: now,
					updatedAt: now,
				})),
			);

			return true;
		} catch (error) {
			console.error("Error bulk creating candies:", error);
			return false;
		}
	}

	/**
	 * Count valid candies for a user
	 * @param guildId - Discord guild ID
	 * @param userId - Discord user ID
	 * @returns Promise<CandyCount> - Count of valid candies
	 */
	async candyCount(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
	): Promise<CandyCount> {
		try {
			const db = getDatabase();
			const now = dayjs().toDate();

			const result = await db
				.select({ count: count() })
				.from(candies)
				.where(
					and(
						eq(candies.guildId, guildId.getValue()),
						eq(candies.receiveUserId, userId.getValue()),
						gt(candies.expiredAt, now),
						isNull(candies.deletedAt),
					),
				);

			return new CandyCount(result[0]?.count ?? 0);
		} catch (error) {
			console.error("Error counting candies:", error);
			return new CandyCount(0);
		}
	}

	/**
	 * Count candies from jackpot (deleted candies)
	 * @param guildId - Discord guild ID
	 * @param userId - Discord user ID
	 * @param candyId - Optional candy ID to filter from
	 * @returns Promise<CandyCount> - Count of jackpot candies
	 */
	async candyCountFromJackpod(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
		candyId: CandyId | undefined,
	): Promise<CandyCount> {
		try {
			const db = getDatabase();

			const conditions = [
				eq(candies.guildId, guildId.getValue()),
				eq(candies.receiveUserId, userId.getValue()),
				isNotNull(candies.deletedAt),
			];

			if (candyId) {
				conditions.push(gt(candies.id, candyId.getValue()));
			}

			const result = await db
				.select({ count: count() })
				.from(candies)
				.where(and(...conditions));

			return new CandyCount(result[0]?.count ?? 0);
		} catch (error) {
			console.error("Error counting candies from jackpot:", error);
			return new CandyCount(0);
		}
	}

	/**
	 * Get the earliest expiration date for valid candies
	 * @param guildId - Discord guild ID
	 * @param userId - Discord user ID
	 * @returns Promise<CandyExpire | undefined> - Earliest expiration date or undefined
	 */
	async candyExpire(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
	): Promise<CandyExpire | undefined> {
		try {
			const db = getDatabase();
			const now = dayjs().toDate();

			const result = await db
				.select()
				.from(candies)
				.where(
					and(
						eq(candies.guildId, guildId.getValue()),
						eq(candies.receiveUserId, userId.getValue()),
						gt(candies.expiredAt, now),
						isNull(candies.deletedAt),
					),
				)
				.orderBy(asc(candies.expiredAt))
				.limit(1);

			return result[0] ? new CandyExpire(result[0].expiredAt) : undefined;
		} catch (error) {
			console.error("Error getting candy expiration:", error);
			return undefined;
		}
	}

	/**
	 * Count candies given by a user in a specific period
	 * @param guildId - Discord guild ID
	 * @param userId - Discord user ID (giver)
	 * @param categoryType - Candy category type
	 * @param createdAt - Start date for counting
	 * @returns Promise<CandyCount> - Count of candies
	 */
	async countByPeriod(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
		categoryType: CandyCategoryType,
		createdAt: CandyCreatedAt,
	): Promise<CandyCount> {
		try {
			const db = getDatabase();

			const result = await db
				.select({ count: count() })
				.from(candies)
				.where(
					and(
						eq(candies.guildId, guildId.getValue()),
						eq(candies.giveUserId, userId.getValue()),
						eq(candies.categoryType, categoryType.getValue()),
						sql`${candies.createdAt} >= ${createdAt.getValue()}`,
					),
				);

			return new CandyCount(result[0]?.count ?? 0);
		} catch (error) {
			console.error("Error counting candies by period:", error);
			return new CandyCount(0);
		}
	}

	/**
	 * Consume (soft delete) a specified number of candies
	 * @param guildId - Discord guild ID
	 * @param userId - Discord user ID
	 * @param candyCount - Number of candies to consume
	 * @returns Promise<CandyId[]> - Array of consumed candy IDs
	 */
	async consumeCandies(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
		candyCount: CandyCount,
	): Promise<CandyId[]> {
		try {
			const db = getDatabase();
			const now = dayjs().toDate();

			// First, find the candies to consume
			const candiesToConsume = await db
				.select()
				.from(candies)
				.where(
					and(
						eq(candies.guildId, guildId.getValue()),
						eq(candies.receiveUserId, userId.getValue()),
						gt(candies.expiredAt, now),
						isNull(candies.deletedAt),
					),
				)
				.limit(candyCount.getValue());

			if (candiesToConsume.length === 0) {
				return [];
			}

			const candyIds = candiesToConsume.map((c) => c.id);

			// Soft delete the candies
			await db
				.update(candies)
				.set({
					deletedAt: now,
					updatedAt: now,
				})
				.where(
					sql`${candies.id} IN (${sql.join(
						candyIds.map((id) => sql`${id}`),
						sql`, `,
					)})`,
				);

			return candyIds.map((id) => new CandyId(id));
		} catch (error) {
			console.error("Error consuming candies:", error);
			return [];
		}
	}

	/**
	 * Find candies by giver and message ID
	 * @param guildId - Discord guild ID
	 * @param giver - Discord channel ID (giver)
	 * @param messageId - Discord message ID
	 * @param categoryType - Candy category type
	 * @returns Promise<Array<CandyDto>> - Array of candy DTOs
	 */
	async findByGiverAndMessageId(
		guildId: DiscordGuildId,
		giver: DiscordChannelId,
		messageId: DiscordMessageId,
		categoryType: CandyCategoryType,
	): Promise<Array<CandyDto>> {
		try {
			const db = getDatabase();

			const results = await db
				.select()
				.from(candies)
				.where(
					and(
						eq(candies.guildId, guildId.getValue()),
						eq(candies.giveUserId, giver.getValue()),
						eq(candies.messageId, messageId.getValue()),
						eq(candies.categoryType, categoryType.getValue()),
					),
				);

			return results.map((row) => this.toDto(row));
		} catch (error) {
			console.error("Error finding candies by giver and message ID:", error);
			return [];
		}
	}

	/**
	 * Convert database row to CandyDto
	 * @param row - Database row object
	 * @returns CandyDto
	 */
	private toDto(row: typeof candies.$inferSelect): CandyDto {
		return new CandyDto(
			new DiscordGuildId(row.guildId),
			new DiscordUserId(row.receiveUserId),
			new DiscordUserId(row.giveUserId),
			new DiscordMessageId(row.messageId),
			new CandyCategoryType(row.categoryType),
			new CandyExpire(row.expiredAt),
		);
	}
}
