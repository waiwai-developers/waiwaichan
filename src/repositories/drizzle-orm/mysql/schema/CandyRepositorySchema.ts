import {
	bigint,
	datetime,
	int,
	mysqlTable,
	varchar,
} from "drizzle-orm/mysql-core";

export const candies = mysqlTable("Candies", {
	id: int("id").primaryKey().autoincrement(),
	guildId: varchar("guildId", { length: 255 }).notNull(),
	receiveUserId: varchar("receiveUserId", { length: 255 }).notNull(),
	giveUserId: varchar("giveUserId", { length: 255 }).notNull(),
	messageId: varchar("messageId", { length: 255 }).notNull(),
	categoryType: int("categoryType").notNull(),
	expiredAt: datetime("expiredAt").notNull(),
	createdAt: datetime("createdAt").notNull(),
	updatedAt: datetime("updatedAt").notNull(),
	deletedAt: datetime("deletedAt"),
});

export type Candy = typeof candies.$inferSelect;
export type NewCandy = typeof candies.$inferInsert;
