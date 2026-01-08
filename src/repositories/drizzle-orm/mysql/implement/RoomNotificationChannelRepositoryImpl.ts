import { RoomNotificationChannelDto } from "@/src/entities/dto/RoomNotificationChannelDto";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import type { IRoomNotificationChannelRepository } from "@/src/logics/Interfaces/repositories/database/IRoomNotificationChannelRepository";
import { and, eq, isNull } from "drizzle-orm";
import { injectable } from "inversify";
import { getDatabase } from "../index";
import { roomNotificationChannels } from "../schema/RoomNotificationChannelRepositorySchema";

/**
 * Drizzle ORM implementation of IRoomNotificationChannelRepository
 * Manages room notification channel operations using Drizzle ORM query builder
 */
@injectable()
export class RoomNotificationChannelRepositoryImpl
	implements IRoomNotificationChannelRepository
{
	/**
	 * Create a new room notification channel
	 * @param data - RoomNotificationChannel data transfer object
	 * @returns Promise<boolean> - true if created successfully
	 */
	async create(data: RoomNotificationChannelDto): Promise<boolean> {
		try {
			const db = getDatabase();
			const now = new Date();

			await db.insert(roomNotificationChannels).values({
				guildId: data.guildId.getValue(),
				channelId: data.channelId.getValue(),
				createdAt: now,
				updatedAt: now,
			});

			return true;
		} catch (error) {
			console.error("Error creating room notification channel:", error);
			return false;
		}
	}

	/**
	 * Delete a room notification channel (soft delete)
	 * @param discordGuildId - Discord guild ID
	 * @returns Promise<boolean> - true if deleted successfully
	 */
	async delete(discordGuildId: DiscordGuildId): Promise<boolean> {
		try {
			const db = getDatabase();
			const now = new Date();

			const result = await db
				.update(roomNotificationChannels)
				.set({
					deletedAt: now,
					updatedAt: now,
				})
				.where(
					and(
						eq(roomNotificationChannels.guildId, discordGuildId.getValue()),
						isNull(roomNotificationChannels.deletedAt),
					),
				);

			return (result as unknown as { affectedRows: number }).affectedRows > 0;
		} catch (error) {
			console.error("Error deleting room notification channel:", error);
			return false;
		}
	}

	/**
	 * Find a room notification channel by guild ID
	 * @param discordGuildId - Discord guild ID
	 * @returns Promise<RoomNotificationChannelDto | undefined> - RoomNotificationChannel DTO or undefined
	 */
	async findOne(
		discordGuildId: DiscordGuildId,
	): Promise<RoomNotificationChannelDto | undefined> {
		try {
			const db = getDatabase();

			const results = await db
				.select()
				.from(roomNotificationChannels)
				.where(
					and(
						eq(roomNotificationChannels.guildId, discordGuildId.getValue()),
						isNull(roomNotificationChannels.deletedAt),
					),
				)
				.limit(1);

			if (results.length === 0) {
				return undefined;
			}

			return this.toDto(results[0]);
		} catch (error) {
			console.error("Error finding room notification channel:", error);
			return undefined;
		}
	}

	/**
	 * Convert database row to RoomNotificationChannelDto
	 * @param row - Database row object
	 * @returns RoomNotificationChannelDto
	 */
	private toDto(
		row: typeof roomNotificationChannels.$inferSelect,
	): RoomNotificationChannelDto {
		return new RoomNotificationChannelDto(
			new DiscordGuildId(row.guildId),
			new DiscordChannelId(row.channelId),
		);
	}
}
