import { datetime, int, mysqlTable, varchar } from "drizzle-orm/mysql-core";

export const candyItems = mysqlTable("Items", {
	id: int("id").primaryKey().autoincrement(),
	name: varchar("name", { length: 255 }).notNull(),
	description: varchar("description", { length: 255 }).notNull(),
	createdAt: datetime("createdAt").notNull(),
	updatedAt: datetime("updatedAt").notNull(),
});

export type CandyItem = typeof candyItems.$inferSelect;
export type NewCandyItem = typeof candyItems.$inferInsert;
