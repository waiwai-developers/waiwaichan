import { RoomChannelDto } from "@/src/entities/dto/RoomChannelDto";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import type { IRoomChannelRepository } from "@/src/logics/Interfaces/repositories/database/IRoomChannelRepository";
import { and, eq, isNull } from "drizzle-orm";
import { injectable } from "inversify";
import { getDatabase } from "../index";
import { roomChannels } from "../schema/RoomChannelRepositorySchema";

/**
 * Drizzle ORM implementation of IRoomChannelRepository
 * Manages room channel operations using Drizzle ORM query builder
 */
@injectable()
export class RoomChannelRepositoryImpl implements IRoomChannelRepository {
	/**
	 * Create a new room channel
	 * @param data - RoomChannel data transfer object
	 * @returns Promise<boolean> - true if created successfully
	 */
	async create(data: RoomChannelDto): Promise<boolean> {
		try {
			const db = getDatabase();
			const now = new Date();

			await db.insert(roomChannels).values({
				guildId: data.guildId.getValue(),
				channelId: data.channelId.getValue(),
				createdAt: now,
				updatedAt: now,
			});

			return true;
		} catch (error) {
			console.error("Error creating room channel:", error);
			return false;
		}
	}

	/**
	 * Find a room channel by guild ID and channel ID
	 * @param data - RoomChannel data transfer object with guildId and channelId
	 * @returns Promise<RoomChannelDto | undefined> - RoomChannel DTO or undefined
	 */
	async findOne(data: RoomChannelDto): Promise<RoomChannelDto | undefined> {
		try {
			const db = getDatabase();

			const results = await db
				.select()
				.from(roomChannels)
				.where(
					and(
						eq(roomChannels.guildId, data.guildId.getValue()),
						eq(roomChannels.channelId, data.channelId.getValue()),
						isNull(roomChannels.deletedAt),
					),
				)
				.limit(1);

			if (results.length === 0) {
				return undefined;
			}

			return this.toDto(results[0]);
		} catch (error) {
			console.error("Error finding room channel:", error);
			return undefined;
		}
	}

	/**
	 * Delete a room channel (soft delete)
	 * @param data - RoomChannel data transfer object with guildId and channelId
	 * @returns Promise<boolean> - true if deleted successfully
	 */
	async delete(data: RoomChannelDto): Promise<boolean> {
		try {
			const db = getDatabase();
			const now = new Date();

			const result = await db
				.update(roomChannels)
				.set({
					deletedAt: now,
					updatedAt: now,
				})
				.where(
					and(
						eq(roomChannels.guildId, data.guildId.getValue()),
						eq(roomChannels.channelId, data.channelId.getValue()),
						isNull(roomChannels.deletedAt),
					),
				);

			// Check if any rows were affected
			return (result as unknown as { affectedRows: number }).affectedRows > 0;
		} catch (error) {
			console.error("Error deleting room channel:", error);
			return false;
		}
	}

	/**
	 * Convert database row to RoomChannelDto
	 * @param row - Database row object
	 * @returns RoomChannelDto
	 */
	private toDto(row: typeof roomChannels.$inferSelect): RoomChannelDto {
		return new RoomChannelDto(
			new DiscordGuildId(row.guildId),
			new DiscordChannelId(row.channelId),
		);
	}
}
