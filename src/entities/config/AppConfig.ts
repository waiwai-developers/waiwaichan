import { existsSync, readFileSync } from "node:fs";

interface DiscordConfig {
	token: string;
	clientId: string;
}
interface DeepLConfig {
	deeplApiKey: string;
}
interface OpenAIConfig {
	openaiApiKey: string;
	gptModel: string;
	gptPrompt: string;
}

interface GithubConfig {
	appId?: string;
	privateKey?: string;
	installationId?: string;
	token?: string;
	owner: string;
	repo: string;
}

interface GCPInstanceConfig {
	project: string;
	zone: string;
	instance: string;
}

interface AppConfigType {
	discord: DiscordConfig;
	deepl: DeepLConfig;
	openai: OpenAIConfig;
	github: GithubConfig;
	gcp: GCPInstanceConfig;
	backend: {
		candyEmoji: string;
		candySuperEmoji: string;
		candyLogChannel: string;
		candyBoxAmount: number;
		crownLogChannel: string;
	};
}

const loadAppConfig = (): AppConfigType | null => {
	const configPath = "config/config.json";
	if (existsSync(configPath)) {
		return JSON.parse(readFileSync(configPath, "utf8"));
	}
	return null;
};

export const GetEnvAppConfig = (): AppConfigType => {
	const config = loadAppConfig();
	if (config) {
		return config;
	}
	throw new Error("App configuration not found: config/config.json is required");
};

export const AppConfig: AppConfigType = GetEnvAppConfig();
