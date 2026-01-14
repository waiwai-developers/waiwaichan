import { RoomAddChannelDto } from "@/src/entities/dto/RoomAddChannelDto";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import type { IRoomAddChannelRepository } from "@/src/logics/Interfaces/repositories/database/IRoomAddChannelRepository";
import { and, eq, isNull } from "drizzle-orm";
import { injectable } from "inversify";
import { getDatabase } from "../index";
import { roomAddChannels } from "../schema/RoomAddChannelRepositorySchema";

/**
 * Drizzle ORM implementation of IRoomAddChannelRepository
 * Manages room add channel operations using Drizzle ORM query builder
 */
@injectable()
export class RoomAddChannelRepositoryImpl implements IRoomAddChannelRepository {
	/**
	 * Create a new room add channel
	 * @param data - RoomAddChannel data transfer object
	 * @returns Promise<boolean> - true if created successfully
	 */
	async create(data: RoomAddChannelDto): Promise<boolean> {
		try {
			const db = getDatabase();
			const now = new Date();

			await db.insert(roomAddChannels).values({
				guildId: data.guildId.getValue(),
				channelId: data.channelId.getValue(),
				createdAt: now,
				updatedAt: now,
			});

			return true;
		} catch (error) {
			console.error("Error creating room add channel:", error);
			return false;
		}
	}

	/**
	 * Delete a room add channel (soft delete)
	 * @param discordGuildId - Discord guild ID
	 * @returns Promise<boolean> - true if deleted successfully
	 */
	async delete(discordGuildId: DiscordGuildId): Promise<boolean> {
		try {
			const db = getDatabase();
			const now = new Date();

			const result = await db
				.update(roomAddChannels)
				.set({
					deletedAt: now,
					updatedAt: now,
				})
				.where(
					and(
						eq(roomAddChannels.guildId, discordGuildId.getValue()),
						isNull(roomAddChannels.deletedAt),
					),
				);

			// Check if any rows were affected
			return (result as unknown as { affectedRows: number }).affectedRows > 0;
		} catch (error) {
			console.error("Error deleting room add channel:", error);
			return false;
		}
	}

	/**
	 * Find a room add channel by guild ID
	 * @param discordGuildId - Discord guild ID
	 * @returns Promise<RoomAddChannelDto | undefined> - RoomAddChannel DTO or undefined
	 */
	async findOne(
		discordGuildId: DiscordGuildId,
	): Promise<RoomAddChannelDto | undefined> {
		try {
			const db = getDatabase();

			const results = await db
				.select()
				.from(roomAddChannels)
				.where(
					and(
						eq(roomAddChannels.guildId, discordGuildId.getValue()),
						isNull(roomAddChannels.deletedAt),
					),
				)
				.limit(1);

			if (results.length === 0) {
				return undefined;
			}

			return this.toDto(results[0]);
		} catch (error) {
			console.error("Error finding room add channel:", error);
			return undefined;
		}
	}

	/**
	 * Convert database row to RoomAddChannelDto
	 * @param row - Database row object
	 * @returns RoomAddChannelDto
	 */
	private toDto(row: typeof roomAddChannels.$inferSelect): RoomAddChannelDto {
		return new RoomAddChannelDto(
			new DiscordGuildId(row.guildId),
			new DiscordChannelId(row.channelId),
		);
	}
}
