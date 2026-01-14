import { datetime, int, mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const roomAddChannels = mysqlTable("RoomAddChannels", {
	id: int("id").primaryKey().autoincrement(),
	guildId: varchar("guildId", { length: 255 }).notNull(),
	channelId: varchar("channelId", { length: 255 }).notNull(),
	createdAt: datetime("createdAt").notNull(),
	updatedAt: datetime("updatedAt").notNull(),
	deletedAt: datetime("deletedAt"),
});

export type RoomAddChannel = typeof roomAddChannels.$inferSelect;
export type NewRoomAddChannel = typeof roomAddChannels.$inferInsert;
