import { migrator } from "@/migrator/umzug";
import { DatabaseConfig } from "@/src/entities/config/DatabaseConfig";
import {
	MySqlContainer,
	type StartedMySqlContainer,
} from "@testcontainers/mysql";

let container: StartedMySqlContainer;
export const ContainerUp = async () => {
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
};

export const ContainerDown = async () => {
	await container.stop({
		remove: true,
		removeVolumes: true,
	});
};
