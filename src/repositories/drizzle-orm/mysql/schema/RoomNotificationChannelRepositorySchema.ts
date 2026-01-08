import { datetime, int, mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const roomNotificationChannels = mysqlTable("RoomNotificationChannels", {
	id: int("id").primaryKey().autoincrement(),
	guildId: varchar("guildId", { length: 255 }).notNull(),
	channelId: varchar("channelId", { length: 255 }).notNull(),
	createdAt: datetime("createdAt").notNull(),
	updatedAt: datetime("updatedAt").notNull(),
	deletedAt: datetime("deletedAt"),
});

export type RoomNotificationChannel =
	typeof roomNotificationChannels.$inferSelect;
export type NewRoomNotificationChannel =
	typeof roomNotificationChannels.$inferInsert;
