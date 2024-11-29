import * as fs from "node:fs";
import path from "node:path";
import { migrator, seeder } from "@/migrator/umzug";
import { DatabaseConfig, type DatabaseConfigType } from "@/src/entities/config/DatabaseConfig";
import { MySqlContainer, type StartedMySqlContainer } from "@testcontainers/mysql";
const dirname = __dirname;

let container: StartedMySqlContainer;
const TEMP_DATABASE_FILE = path.join(dirname, "container_db.json");

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
	fs.writeFileSync(TEMP_DATABASE_FILE, JSON.stringify(dbc));
	await migrator(dbc).up();
	await seeder(dbc).up();
};

export const GetContainerDBConfig = () => {
	const dbc: DatabaseConfigType = JSON.parse(fs.readFileSync(TEMP_DATABASE_FILE, "utf-8"));
	return dbc;
};
export const ContainerDown = async () => {
	if (fs.existsSync(TEMP_DATABASE_FILE)) {
		fs.unlinkSync(TEMP_DATABASE_FILE);
	}

	await container.stop({
		remove: true,
		removeVolumes: true,
	});
};
