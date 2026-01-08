import {
	datetime,
	int,
	json,
	mysqlTable,
	primaryKey,
	varchar,
} from "drizzle-orm/mysql-core";

export const threads = mysqlTable(
	"Threads",
	{
		guildId: varchar("guildId", { length: 255 }).notNull(),
		messageId: varchar("messageId", { length: 255 }).notNull(),
		categoryType: int("categoryType").notNull(),
		metadata: json("metadata").notNull(),
		createdAt: datetime("createdAt").notNull(),
		updatedAt: datetime("updatedAt").notNull(),
		deletedAt: datetime("deletedAt"),
	},
	(table) => [primaryKey({ columns: [table.guildId, table.messageId] })],
);

export type Thread = typeof threads.$inferSelect;
export type NewThread = typeof threads.$inferInsert;
