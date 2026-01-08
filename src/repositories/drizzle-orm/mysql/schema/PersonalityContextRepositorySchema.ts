import { datetime, int, mysqlTable, primaryKey } from "drizzle-orm/mysql-core";

export const personalityContexts = mysqlTable(
	"PersonalityContexts",
	{
		personalityId: int("personalityId").notNull(),
		contextId: int("contextId").notNull(),
		createdAt: datetime("createdAt").notNull(),
		updatedAt: datetime("updatedAt").notNull(),
	},
	(table) => [primaryKey({ columns: [table.personalityId, table.contextId] })],
);

export type PersonalityContext = typeof personalityContexts.$inferSelect;
export type NewPersonalityContext = typeof personalityContexts.$inferInsert;
