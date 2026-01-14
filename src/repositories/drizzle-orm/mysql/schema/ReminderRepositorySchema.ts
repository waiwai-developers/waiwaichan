import {
	bigint,
	datetime,
	int,
	mysqlTable,
	varchar,
} from "drizzle-orm/mysql-core";

export const reminders = mysqlTable("Reminders", {
	id: int("id").primaryKey().autoincrement(),
	guildId: bigint("guildId", { mode: "number" }).notNull(),
	channelId: bigint("channelId", { mode: "number" }).notNull(),
	userId: bigint("userId", { mode: "number" }).notNull(),
	receiveUserName: varchar("receiveUserName", { length: 255 }).notNull(),
	message: varchar("message", { length: 255 }).notNull(),
	remindAt: datetime("remindAt").notNull(),
	createdAt: datetime("createdAt").notNull(),
	updatedAt: datetime("updatedAt").notNull(),
	deletedAt: datetime("deletedAt"),
});

export type Reminder = typeof reminders.$inferSelect;
export type NewReminder = typeof reminders.$inferInsert;
