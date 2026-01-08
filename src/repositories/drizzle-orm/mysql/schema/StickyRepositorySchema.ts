import { datetime, int, mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const stickies = mysqlTable("Stickies", {
	id: int("id").primaryKey().autoincrement(),
	guildId: varchar("guildId", { length: 255 }).notNull(),
	channelId: varchar("channelId", { length: 255 }).notNull(),
	userId: varchar("userId", { length: 255 }).notNull(),
	messageId: varchar("messageId", { length: 255 }).notNull(),
	message: varchar("message", { length: 255 }).notNull(),
	createdAt: datetime("createdAt").notNull(),
	updatedAt: datetime("updatedAt").notNull(),
	deletedAt: datetime("deletedAt"),
});

export type Sticky = typeof stickies.$inferSelect;
export type NewSticky = typeof stickies.$inferInsert;
