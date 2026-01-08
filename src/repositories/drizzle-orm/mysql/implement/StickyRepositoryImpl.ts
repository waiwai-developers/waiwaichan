import { StickyDto } from "@/src/entities/dto/StickyDto";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import { DiscordMessageId } from "@/src/entities/vo/DiscordMessageId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { StickyMessage } from "@/src/entities/vo/StickyMessage";
import type { IStickyRepository } from "@/src/logics/Interfaces/repositories/database/IStickyRepository";
import { and, eq, isNull } from "drizzle-orm";
import { injectable } from "inversify";
import { getDatabase } from "../index";
import { stickies } from "../schema/StickyRepositorySchema";

/**
 * Drizzle ORM implementation of IStickyRepository
 * Manages sticky message operations using Drizzle ORM query builder
 */
@injectable()
export class StickyRepositoryImpl implements IStickyRepository {
	/**
	 * Create a new sticky message
	 * @param data - Sticky data transfer object
	 * @returns Promise<boolean> - true if created successfully
	 */
	async create(data: StickyDto): Promise<boolean> {
		try {
			const db = getDatabase();
			const now = new Date();

			await db.insert(stickies).values({
				guildId: data.guildId.getValue(),
				channelId: data.channelId.getValue(),
				userId: data.userId.getValue(),
				messageId: data.messageId.getValue(),
				message: data.message.getValue(),
				createdAt: now,
				updatedAt: now,
			});

			return true;
		} catch (error) {
			console.error("Error creating sticky:", error);
			return false;
		}
	}

	/**
	 * Delete a sticky message (soft delete)
	 * @param guildId - Discord guild ID
	 * @param channelId - Discord channel ID
	 * @returns Promise<boolean> - true if deleted successfully
	 */
	async delete(
		guildId: DiscordGuildId,
		channelId: DiscordChannelId,
	): Promise<boolean> {
		try {
			const db = getDatabase();
			const now = new Date();

			const result = await db
				.update(stickies)
				.set({
					deletedAt: now,
					updatedAt: now,
				})
				.where(
					and(
						eq(stickies.guildId, guildId.getValue()),
						eq(stickies.channelId, channelId.getValue()),
						isNull(stickies.deletedAt),
					),
				);

			// Check if any rows were affected
			return (result as unknown as { affectedRows: number }).affectedRows > 0;
		} catch (error) {
			console.error("Error deleting sticky:", error);
			return false;
		}
	}

	/**
	 * Update the message ID of a sticky
	 * @param guildId - Discord guild ID
	 * @param channelId - Discord channel ID
	 * @param messageId - New Discord message ID
	 * @returns Promise<boolean> - true if updated successfully
	 */
	async updateForMessageId(
		guildId: DiscordGuildId,
		channelId: DiscordChannelId,
		messageId: DiscordMessageId,
	): Promise<boolean> {
		try {
			const db = getDatabase();
			const now = new Date();

			const result = await db
				.update(stickies)
				.set({
					messageId: messageId.getValue(),
					updatedAt: now,
				})
				.where(
					and(
						eq(stickies.guildId, guildId.getValue()),
						eq(stickies.channelId, channelId.getValue()),
						isNull(stickies.deletedAt),
					),
				);

			return (result as unknown as { affectedRows: number }).affectedRows > 0;
		} catch (error) {
			console.error("Error updating sticky message ID:", error);
			return false;
		}
	}

	/**
	 * Update the message content of a sticky
	 * @param guildId - Discord guild ID
	 * @param channelId - Discord channel ID
	 * @param message - New sticky message content
	 * @returns Promise<boolean> - true if updated successfully
	 */
	async updateForMessage(
		guildId: DiscordGuildId,
		channelId: DiscordChannelId,
		message: StickyMessage,
	): Promise<boolean> {
		try {
			const db = getDatabase();
			const now = new Date();

			const result = await db
				.update(stickies)
				.set({
					message: message.getValue(),
					updatedAt: now,
				})
				.where(
					and(
						eq(stickies.guildId, guildId.getValue()),
						eq(stickies.channelId, channelId.getValue()),
						isNull(stickies.deletedAt),
					),
				);

			return (result as unknown as { affectedRows: number }).affectedRows > 0;
		} catch (error) {
			console.error("Error updating sticky message:", error);
			return false;
		}
	}

	/**
	 * Find a sticky by guild ID and channel ID
	 * @param guildId - Discord guild ID
	 * @param channelId - Discord channel ID
	 * @returns Promise<StickyDto | undefined> - Sticky DTO or undefined if not found
	 */
	async findOne(
		guildId: DiscordGuildId,
		channelId: DiscordChannelId,
	): Promise<StickyDto | undefined> {
		try {
			const db = getDatabase();

			const results = await db
				.select()
				.from(stickies)
				.where(
					and(
						eq(stickies.guildId, guildId.getValue()),
						eq(stickies.channelId, channelId.getValue()),
						isNull(stickies.deletedAt),
					),
				)
				.limit(1);

			if (results.length === 0) {
				return undefined;
			}

			return this.toDto(results[0]);
		} catch (error) {
			console.error("Error finding sticky:", error);
			return undefined;
		}
	}

	/**
	 * Find all stickies by guild ID
	 * @param guildId - Discord guild ID
	 * @returns Promise<StickyDto[]> - Array of sticky DTOs
	 */
	async findByCommunityId(guildId: DiscordGuildId): Promise<StickyDto[]> {
		try {
			const db = getDatabase();

			const results = await db
				.select()
				.from(stickies)
				.where(
					and(
						eq(stickies.guildId, guildId.getValue()),
						isNull(stickies.deletedAt),
					),
				);

			return results.map((row) => this.toDto(row));
		} catch (error) {
			console.error("Error finding stickies by community ID:", error);
			return [];
		}
	}

	/**
	 * Convert database row to StickyDto
	 * @param row - Database row object
	 * @returns StickyDto
	 */
	private toDto(row: typeof stickies.$inferSelect): StickyDto {
		return new StickyDto(
			new DiscordGuildId(row.guildId),
			new DiscordChannelId(row.channelId),
			new DiscordUserId(row.userId),
			new DiscordMessageId(row.messageId),
			new StickyMessage(row.message),
		);
	}
}
