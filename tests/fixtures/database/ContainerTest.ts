import { DatabaseConfig } from "@/src/entities/config/DatabaseConfig";
import { StartedMySqlContainer } from "@testcontainers/mysql";
let container: StartedMySqlContainer;

export const ContainerUp = async () => {
	const testDBConfig = DatabaseConfig;
};
