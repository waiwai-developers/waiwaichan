import { ID_JACKPOT } from "@/src/entities/constants/Items";
import { UserCandyItemDto } from "@/src/entities/dto/UserCandyItemDto";
import { UserCandyItemWithItemGroupByDto } from "@/src/entities/dto/UserCandyItemWithItemGroupByDto";
import { CandyId } from "@/src/entities/vo/CandyId";
import { CandyItemDescription } from "@/src/entities/vo/CandyItemDescription";
import { CandyItemId } from "@/src/entities/vo/CandyItemId";
import { CandyItemName } from "@/src/entities/vo/CandyItemName";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { UserCandyItemCount } from "@/src/entities/vo/UserCandyItemCount";
import { UserCandyItemExpire } from "@/src/entities/vo/UserCandyItemExpire";
import { UserCandyItemId } from "@/src/entities/vo/UserCandyItemId";
import { UserCandyItemMinExpire } from "@/src/entities/vo/UserCandyItemMinExpire";
import { UserCandyItemMinId } from "@/src/entities/vo/UserCandyItemMinId";
import type { IUserCandyItemRepository } from "@/src/logics/Interfaces/repositories/database/IUserCandyItemRepository";
import dayjs from "dayjs";
import {
	and,
	asc,
	count,
	desc,
	eq,
	gt,
	gte,
	inArray,
	isNull,
	min,
	sql,
} from "drizzle-orm";
import { injectable } from "inversify";
import { getDatabase } from "../index";
import { candyItems } from "../schema/CandyItemRepositorySchema";
import { userCandyItems } from "../schema/UserCandyItemRepositorySchema";

/**
 * Drizzle ORM implementation of IUserCandyItemRepository
 * Manages user candy item operations using Drizzle ORM query builder
 */
@injectable()
export class UserCandyItemRepositoryImpl implements IUserCandyItemRepository {
	/**
	 * Bulk create user candy items
	 * @param data - Array of UserCandyItemDto objects
	 * @returns Promise<UserCandyItemId[]> - Array of created item IDs
	 */
	async bulkCreate(data: UserCandyItemDto[]): Promise<UserCandyItemId[]> {
		try {
			const db = getDatabase();
			const now = new Date();

			const valuesToInsert = data.map((u) => ({
				guildId: u.guildId.getValue(),
				userId: u.userId.getValue(),
				itemId: u.itemId.getValue(),
				candyId: u.candyId.getValue(),
				expiredAt: u.expiredAt.getValue(),
				createdAt: now,
				updatedAt: now,
			}));

			// Insert all values
			await db.insert(userCandyItems).values(valuesToInsert);

			// Get the last inserted ID and calculate the IDs for all inserted records
			const result = await db.execute(sql`SELECT LAST_INSERT_ID() as lastId`);
			const rows = result[0] as unknown as { lastId: number }[];
			const lastId = rows[0]?.lastId || 0;
			const firstId = lastId - data.length + 1;

			return data.map((_, index) => new UserCandyItemId(firstId + index));
		} catch (error) {
			console.error("Error bulk creating user candy items:", error);
			return [];
		}
	}

	/**
	 * Find user candy items that are not used (not expired) grouped by itemId
	 * @param guildId - Discord guild ID
	 * @param userId - Discord user ID
	 * @returns Promise<UserCandyItemWithItemGroupByDto[]> - Array of grouped items with candy item info
	 */
	async findByNotUsed(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
	): Promise<UserCandyItemWithItemGroupByDto[]> {
		try {
			const db = getDatabase();
			const now = dayjs().toDate();

			const results = await db
				.select({
					userId: userCandyItems.userId,
					itemId: userCandyItems.itemId,
					aggrCount: count(userCandyItems.id),
					aggrMinId: min(userCandyItems.id),
					aggrMinExpiredAt: min(userCandyItems.expiredAt),
					itemName: candyItems.name,
					itemDescription: candyItems.description,
				})
				.from(userCandyItems)
				.innerJoin(candyItems, eq(userCandyItems.itemId, candyItems.id))
				.where(
					and(
						eq(userCandyItems.guildId, guildId.getValue()),
						eq(userCandyItems.userId, userId.getValue()),
						gt(userCandyItems.expiredAt, now),
						isNull(userCandyItems.deletedAt),
					),
				)
				.groupBy(userCandyItems.itemId);

			return results.map((row) => {
				return new UserCandyItemWithItemGroupByDto(
					new CandyItemName(row.userId),
					new CandyItemId(row.itemId),
					new CandyItemName(row.itemName),
					new CandyItemDescription(row.itemDescription),
					new UserCandyItemCount(row.aggrCount),
					new UserCandyItemMinId(row.aggrMinId ?? 0),
					new UserCandyItemMinExpire(row.aggrMinExpiredAt ?? now),
				);
			});
		} catch (error) {
			console.error("Error finding user candy items:", error);
			return [];
		}
	}

	/**
	 * Get the last jackpot candy ID for a user
	 * @param guildId - Discord guild ID
	 * @param userId - Discord user ID
	 * @returns Promise<CandyId | undefined> - The candy ID or undefined if not found
	 */
	async lastJackpodCandyId(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
	): Promise<CandyId | undefined> {
		try {
			const db = getDatabase();

			const results = await db
				.select({ candyId: userCandyItems.candyId })
				.from(userCandyItems)
				.where(
					and(
						eq(userCandyItems.guildId, guildId.getValue()),
						eq(userCandyItems.itemId, ID_JACKPOT),
						eq(userCandyItems.userId, userId.getValue()),
						isNull(userCandyItems.deletedAt),
					),
				)
				.orderBy(desc(userCandyItems.createdAt))
				.limit(1);

			if (results.length === 0) {
				return undefined;
			}

			return new CandyId(results[0].candyId);
		} catch (error) {
			console.error("Error finding last jackpot candy ID:", error);
			return undefined;
		}
	}

	/**
	 * Check if user has received a jackpot in the current year
	 * @param guildId - Discord guild ID
	 * @param userId - Discord user ID
	 * @returns Promise<boolean> - true if user has jackpot in current year
	 */
	async hasJackpotInCurrentYear(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
	): Promise<boolean> {
		try {
			const db = getDatabase();
			const startOfYear = dayjs().startOf("year").toDate();

			const results = await db
				.select({ id: userCandyItems.id })
				.from(userCandyItems)
				.where(
					and(
						eq(userCandyItems.guildId, guildId.getValue()),
						eq(userCandyItems.userId, userId.getValue()),
						eq(userCandyItems.itemId, ID_JACKPOT),
						gte(userCandyItems.createdAt, startOfYear),
						isNull(userCandyItems.deletedAt),
					),
				)
				.limit(1);

			return results.length > 0;
		} catch (error) {
			console.error("Error checking jackpot in current year:", error);
			return false;
		}
	}

	/**
	 * Exchange user candy items by type and amount (soft delete)
	 * @param guildId - Discord guild ID
	 * @param userId - Discord user ID
	 * @param type - Candy item type ID
	 * @param amount - Amount to exchange
	 * @returns Promise<number> - Number of items exchanged (deleted)
	 */
	async exchangeByTypeAndAmount(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
		type: CandyItemId,
		amount: UserCandyItemCount,
	): Promise<number> {
		try {
			const db = getDatabase();
			const now = dayjs().toDate();

			// Find items to be exchanged (ordered by expiredAt ASC to use oldest first)
			const itemsToExchange = await db
				.select({ id: userCandyItems.id })
				.from(userCandyItems)
				.where(
					and(
						eq(userCandyItems.guildId, guildId.getValue()),
						eq(userCandyItems.userId, userId.getValue()),
						eq(userCandyItems.itemId, type.getValue()),
						gt(userCandyItems.expiredAt, now),
						isNull(userCandyItems.deletedAt),
					),
				)
				.orderBy(asc(userCandyItems.expiredAt))
				.limit(amount.getValue());

			if (itemsToExchange.length < amount.getValue()) {
				throw new Error("no items found for satisfy request");
			}

			const idsToDelete = itemsToExchange.map((item) => item.id);

			// Soft delete the items
			const result = await db
				.update(userCandyItems)
				.set({
					deletedAt: now,
					updatedAt: now,
				})
				.where(inArray(userCandyItems.id, idsToDelete));

			return (result as unknown as { affectedRows: number }).affectedRows;
		} catch (error) {
			console.error("Error exchanging user candy items:", error);
			throw error;
		}
	}

	/**
	 * Convert database row to UserCandyItemDto
	 * @param row - Database row object
	 * @returns UserCandyItemDto
	 */
	private toDto(row: typeof userCandyItems.$inferSelect): UserCandyItemDto {
		return new UserCandyItemDto(
			new UserCandyItemId(row.id),
			new DiscordGuildId(row.guildId),
			new DiscordUserId(row.userId),
			new CandyItemId(row.itemId),
			new CandyId(row.candyId),
			new UserCandyItemExpire(row.expiredAt),
		);
	}
}
