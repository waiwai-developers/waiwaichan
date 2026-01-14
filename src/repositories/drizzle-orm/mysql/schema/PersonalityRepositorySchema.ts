import {
	datetime,
	int,
	json,
	mysqlTable,
	varchar,
} from "drizzle-orm/mysql-core";

export const personalities = mysqlTable("Personalities", {
	id: int("id").primaryKey().autoincrement(),
	name: varchar("name", { length: 255 }).notNull(),
	prompt: json("prompt").notNull(),
	createdAt: datetime("createdAt").notNull(),
	updatedAt: datetime("updatedAt").notNull(),
});

export type Personality = typeof personalities.$inferSelect;
export type NewPersonality = typeof personalities.$inferInsert;
