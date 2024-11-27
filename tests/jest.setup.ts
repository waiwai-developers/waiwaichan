import "reflect-metadata";
import { migrator } from "@/migrator/umzug";
import { DatabaseConfig } from "@/src/entities/config/DatabaseConfig";
import {
	MySqlContainer,
	type StartedMySqlContainer,
} from "@testcontainers/mysql";

let container: StartedMySqlContainer;
beforeAll(async () => {
	container = await new MySqlContainer()
		.withDatabase(DatabaseConfig.test.database)
		.withRootPassword(DatabaseConfig.test.password)
		.start();
	DatabaseConfig.test = {
		host: container.getHost(),
		port: container.getPort(),
		username: container.getUsername(),
		password: container.getUserPassword(),
		database: container.getDatabase(),
		dialect: "mysql",
	};
	await migrator(DatabaseConfig.test).up();
}, 60_000);
afterAll(async () => {
	await container.stop({
		remove: true,
		removeVolumes: true,
	});
});
