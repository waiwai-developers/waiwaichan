import * as fs from "node:fs";
import path from "node:path";
import { migrator, seeder } from "@/migrator/umzug";
import { DatabaseConfig, type DatabaseConfigType } from "@/src/entities/config/DatabaseConfig";
import { MySqlContainer, type StartedMySqlContainer } from "@testcontainers/mysql";
let container: StartedMySqlContainer;

const TEMP_DATABASE_FILE = path.join("./config/database.json");

export const ContainerUp = async () => {
	container = await new MySqlContainer().withDatabase(DatabaseConfig.test.database).withRootPassword(DatabaseConfig.test.password).start();
	const dbc: DatabaseConfigType = {
		host: container.getHost(),
		port: container.getPort(),
		username: container.getUsername(),
		password: container.getUserPassword(),
		database: container.getDatabase(),
		dialect: "mysql",
	};
	await migrator(dbc).up();
	await seeder(dbc).up();
	const isConfigExist = fs.existsSync(TEMP_DATABASE_FILE);
	let config = { test: dbc };
	if (isConfigExist) {
		const content = fs.readFileSync(TEMP_DATABASE_FILE, "utf8");
		config = Object.assign(JSON.parse(content), config);
	}
	fs.writeFileSync(TEMP_DATABASE_FILE, JSON.stringify(config, null, "\t"));
};

export const ContainerDown = async () => {
	await container.stop({
		remove: true,
		removeVolumes: true,
	});
};
