import {
	datetime,
	int,
	json,
	mysqlTable,
	varchar,
} from "drizzle-orm/mysql-core";

export const contexts = mysqlTable("Contexts", {
	id: int("id").primaryKey().autoincrement(),
	name: varchar("name", { length: 255 }).notNull(),
	prompt: json("prompt").notNull(),
	createdAt: datetime("createdAt").notNull(),
	updatedAt: datetime("updatedAt").notNull(),
});

export type Context = typeof contexts.$inferSelect;
export type NewContext = typeof contexts.$inferInsert;
