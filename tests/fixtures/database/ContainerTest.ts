import * as fs from "node:fs";
import path from "node:path";
import { migrator, seeder } from "@/migrator/umzug";
import { DatabaseConfig, type DatabaseConfigType } from "@/src/entities/config/DatabaseConfig";
import { MySqlContainer, type StartedMySqlContainer } from "@testcontainers/mysql";
import { DockerComposeEnvironment } from "testcontainers";

let container: StartedMySqlContainer | undefined;

const TEMP_DATABASE_FILE = path.join("./config/database.json");

export const ContainerUp = async () => {
	try {
		// Dockerがインストールされているかをチェックするためのログを追加
		console.log("Starting MySQL container for tests...");

		container = await new MySqlContainer()
			.withDatabase(DatabaseConfig.test.database)
			.withRootPassword(DatabaseConfig.test.password)
			.start();

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
	} catch (error) {
		console.error("Error starting MySQL container:", error);
		throw error; // エラーを再スローして、テストが失敗するようにします
	}
};

export const ContainerDown = async () => {
	if (container) {
		try {
			await container.stop({
				remove: true,
				removeVolumes: true,
			});
			console.log("MySQL container stopped successfully");
		} catch (error) {
			console.error("Error stopping MySQL container:", error);
		}
	} else {
		console.log("No container to stop");
	}
};
