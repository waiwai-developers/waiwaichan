import { GetTestDBConfig } from "@/src/entities/config/DatabaseConfig";
import { StartedMySqlContainer } from "@testcontainers/mysql";
let container: StartedMySqlContainer;

export const ContainerUp = async () => {
	const testDBConfig = GetTestDBConfig();
	if (!testDBConfig) {
		throw new Error("Test database configuration not found: config/databasetest.json is required");
	}
};
