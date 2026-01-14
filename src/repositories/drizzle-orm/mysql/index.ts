/**
 * Drizzle ORM MySQL Repository Exports
 * This module provides access to all Drizzle ORM based repositories and database utilities
 */

import { GetEnvDatabaseConfig } from "@/src/entities/config/DatabaseConfig";
import type { ILogger } from "@/src/logics/Interfaces/repositories/logger/ILogger";
import { drizzle } from "drizzle-orm/mysql2";
import type { MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as candyItemSchema from "./schema/CandyItemRepositorySchema";
import * as candySchema from "./schema/CandyRepositorySchema";
import * as contextSchema from "./schema/ContextRepositorySchema";
import * as crownSchema from "./schema/CrownRepositorySchema";
import * as personalityContextSchema from "./schema/PersonalityContextRepositorySchema";
import * as personalitySchema from "./schema/PersonalityRepositorySchema";
import * as reminderSchema from "./schema/ReminderRepositorySchema";
import * as roomAddChannelSchema from "./schema/RoomAddChannelRepositorySchema";
import * as roomChannelSchema from "./schema/RoomChannelRepositorySchema";
import * as roomNotificationChannelSchema from "./schema/RoomNotificationChannelRepositorySchema";
import * as stickySchema from "./schema/StickyRepositorySchema";
import * as threadSchema from "./schema/ThreadRepositorySchema";
import * as userCandyItemSchema from "./schema/UserCandyItemRepositorySchema";

const schema = {
	...reminderSchema,
	...candyItemSchema,
	...candySchema,
	...contextSchema,
	...crownSchema,
	...personalityContextSchema,
	...personalitySchema,
	...roomAddChannelSchema,
	...roomChannelSchema,
	...roomNotificationChannelSchema,
	...stickySchema,
	...threadSchema,
	...userCandyItemSchema,
};

/**
 * Database connection instance
 */
let db: MySql2Database<typeof schema> | null = null;
let pool: mysql.Pool | null = null;

/**
 * Initialize the database connection
 * @param logger - Logger instance for SQL query logging
 * @returns Drizzle database instance
 */
export async function initializeDatabase(logger?: ILogger) {
	if (db && pool) {
		return db;
	}

	const dbConfig = GetEnvDatabaseConfig();

	// Create MySQL connection pool
	pool = mysql.createPool({
		host: dbConfig.host,
		port: dbConfig.port,
		user: dbConfig.username,
		password: dbConfig.password,
		database: dbConfig.database,
		waitForConnections: true,
		connectionLimit: 10,
		queueLimit: 0,
	});

	// Initialize Drizzle with schema
	// Note: Custom logging can be added via Drizzle logger configuration if needed
	db = drizzle(pool, { schema, mode: "default" });

	if (logger) {
		logger.info("Drizzle ORM database connection initialized");
	}

	return db;
}

/**
 * Get the database instance
 * Throws an error if the database is not initialized
 * @returns Drizzle database instance
 */
export function getDatabase() {
	if (!db) {
		throw new Error(
			"Database not initialized. Call initializeDatabase() first.",
		);
	}
	return db;
}

/**
 * Close the database connection
 */
export async function closeDatabase() {
	if (pool) {
		await pool.end();
		pool = null;
		db = null;
	}
}

/**
 * Export schema and repositories
 */
export { schema };
export * from "./schema/ReminderRepositorySchema";
export * from "./schema/CandyItemRepositorySchema";
export * from "./schema/CandyRepositorySchema";
export * from "./schema/ContextRepositorySchema";
export * from "./schema/CrownRepositorySchema";
export * from "./schema/PersonalityContextRepositorySchema";
export * from "./schema/PersonalityRepositorySchema";
export * from "./schema/RoomAddChannelRepositorySchema";
export * from "./schema/RoomChannelRepositorySchema";
export * from "./schema/RoomNotificationChannelRepositorySchema";
export * from "./schema/StickyRepositorySchema";
export * from "./schema/ThreadRepositorySchema";
export { ReminderRepositoryImpl } from "./implement/ReminderRepositoryImpl";
export { CandyItemRepositoryImpl } from "./implement/CandyItemRepositoryImpl";
export { CandyRepositoryImpl } from "./implement/CandyRepositoryImpl";
export { ContextRepositoryImpl } from "./implement/ContextRepositoryImpl";
export { CrownRepositoryImpl } from "./implement/CrownRepositoryImpl";
export { PersonalityContextRepositoryImpl } from "./implement/PersonalityContextRepositoryImpl";
export { PersonalityRepositoryImpl } from "./implement/PersonalityRepositoryImpl";
export { RoomAddChannelRepositoryImpl } from "./implement/RoomAddChannelRepositoryImpl";
export { RoomChannelRepositoryImpl } from "./implement/RoomChannelRepositoryImpl";
export { RoomNotificationChannelRepositoryImpl } from "./implement/RoomNotificationChannelRepositoryImpl";
export { StickyRepositoryImpl } from "./implement/StickyRepositoryImpl";
export { ThreadRepositoryImpl } from "./implement/ThreadRepositoryImpl";
export { UserCandyItemRepositoryImpl } from "./implement/UserCandyItemRepositoryImpl";
export * from "./schema/UserCandyItemRepositorySchema";
