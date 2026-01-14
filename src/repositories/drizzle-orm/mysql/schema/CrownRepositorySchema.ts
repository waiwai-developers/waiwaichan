import {
	datetime,
	mysqlTable,
	primaryKey,
	varchar,
} from "drizzle-orm/mysql-core";

export const crowns = mysqlTable(
	"Crowns",
	{
		guildId: varchar("guildId", { length: 255 }).notNull(),
		messageId: varchar("messageId", { length: 255 }).notNull(),
		createdAt: datetime("createdAt").notNull(),
		updatedAt: datetime("updatedAt").notNull(),
	},
	(table) => [primaryKey({ columns: [table.guildId, table.messageId] })],
);

export type Crown = typeof crowns.$inferSelect;
export type NewCrown = typeof crowns.$inferInsert;
