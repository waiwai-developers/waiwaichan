import { ReminderDto } from "@/src/entities/dto/ReminderDto";
import { DiscordChannelId } from "@/src/entities/vo/DiscordChannelId";
import { DiscordGuildId } from "@/src/entities/vo/DiscordGuildId";
import { DiscordUserId } from "@/src/entities/vo/DiscordUserId";
import { ReceiveDiscordUserName } from "@/src/entities/vo/ReceiveDiscordUserName";
import { RemindTime } from "@/src/entities/vo/RemindTime";
import { ReminderId } from "@/src/entities/vo/ReminderId";
import { ReminderMessage } from "@/src/entities/vo/ReminderMessage";
import type { IReminderRepository } from "@/src/logics/Interfaces/repositories/database/IReminderRepository";
import { and, eq, isNull } from "drizzle-orm";
import { injectable } from "inversify";
import { getDatabase } from "../index";
import { reminders } from "../schema/ReminderRepositorySchema";

/**
 * Drizzle ORM implementation of IReminderRepository
 * Manages reminder operations using Drizzle ORM query builder
 */
@injectable()
export class ReminderRepositoryImpl implements IReminderRepository {
	/**
	 * Create a new reminder
	 * @param data - Reminder data transfer object
	 * @returns Promise<boolean> - true if created successfully
	 */
	async create(data: ReminderDto): Promise<boolean> {
		try {
			const db = getDatabase();
			const now = new Date();

			await db.insert(reminders).values({
				guildId: Number(data.guildId.getValue()),
				channelId: Number(data.channelId.getValue()),
				userId: Number(data.userId.getValue()),
				receiveUserName: data.receiveUserName.getValue(),
				message: data.message.getValue(),
				remindAt: data.remindAt.getValue(),
				createdAt: now,
				updatedAt: now,
			});

			return true;
		} catch (error) {
			console.error("Error creating reminder:", error);
			return false;
		}
	}

	/**
	 * Delete a reminder (soft delete)
	 * @param id - Reminder ID
	 * @param guildId - Discord guild ID
	 * @param userId - Discord user ID
	 * @returns Promise<boolean> - true if deleted successfully
	 */
	async deleteReminder(
		id: ReminderId,
		guildId: DiscordGuildId,
		userId: DiscordUserId,
	): Promise<boolean> {
		try {
			const db = getDatabase();
			const now = new Date();

			const result = await db
				.update(reminders)
				.set({
					deletedAt: now,
					updatedAt: now,
				})
				.where(
					and(
						eq(reminders.id, id.getValue()),
						eq(reminders.guildId, Number(guildId.getValue())),
						eq(reminders.userId, Number(userId.getValue())),
						isNull(reminders.deletedAt),
					),
				);

			// Check if any rows were affected
			return (result as unknown as { affectedRows: number }).affectedRows > 0;
		} catch (error) {
			console.error("Error deleting reminder:", error);
			return false;
		}
	}

	/**
	 * Find reminders by user ID
	 * @param guildId - Discord guild ID
	 * @param userId - Discord user ID
	 * @returns Promise<ReminderDto[]> - Array of reminder DTOs
	 */
	async findByUserId(
		guildId: DiscordGuildId,
		userId: DiscordUserId,
	): Promise<ReminderDto[]> {
		try {
			const db = getDatabase();

			const results = await db
				.select()
				.from(reminders)
				.where(
					and(
						eq(reminders.guildId, Number(guildId.getValue())),
						eq(reminders.userId, Number(userId.getValue())),
						isNull(reminders.deletedAt),
					),
				);

			return results.map((row) => this.toDto(row));
		} catch (error) {
			console.error("Error finding reminders by user ID:", error);
			return [];
		}
	}

	/**
	 * Convert database row to ReminderDto
	 * @param row - Database row object
	 * @returns ReminderDto
	 */
	private toDto(row: typeof reminders.$inferSelect): ReminderDto {
		return new ReminderDto(
			new ReminderId(row.id),
			new DiscordGuildId(String(row.guildId)),
			new DiscordChannelId(String(row.channelId)),
			new DiscordUserId(String(row.userId)),
			new ReceiveDiscordUserName(row.receiveUserName),
			new ReminderMessage(row.message),
			new RemindTime(row.remindAt),
		);
	}
}
