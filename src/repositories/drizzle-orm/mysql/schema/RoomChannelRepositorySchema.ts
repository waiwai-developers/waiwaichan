import { datetime, int, mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const roomChannels = mysqlTable("RoomChannels", {
	id: int("id").primaryKey().autoincrement(),
	guildId: varchar("guildId", { length: 255 }).notNull(),
	channelId: varchar("channelId", { length: 255 }).notNull(),
	createdAt: datetime("createdAt").notNull(),
	updatedAt: datetime("updatedAt").notNull(),
	deletedAt: datetime("deletedAt"),
});

export type RoomChannel = typeof roomChannels.$inferSelect;
export type NewRoomChannel = typeof roomChannels.$inferInsert;
