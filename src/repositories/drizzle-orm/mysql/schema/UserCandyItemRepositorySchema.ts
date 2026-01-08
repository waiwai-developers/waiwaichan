import { datetime, int, mysqlTable, varchar } from "drizzle-orm/mysql-core";
import { candyItems } from "./CandyItemRepositorySchema";

export const userCandyItems = mysqlTable("UserItems", {
	id: int("id").primaryKey().autoincrement(),
	userId: varchar("userId", { length: 255 }).notNull(),
	guildId: varchar("guildId", { length: 255 }).notNull(),
	itemId: int("itemId")
		.notNull()
		.references(() => candyItems.id),
	candyId: int("candyId").notNull(),
	expiredAt: datetime("expiredAt").notNull(),
	createdAt: datetime("createdAt").notNull(),
	updatedAt: datetime("updatedAt").notNull(),
	deletedAt: datetime("deletedAt"),
});

export type UserCandyItem = typeof userCandyItems.$inferSelect;
export type NewUserCandyItem = typeof userCandyItems.$inferInsert;
