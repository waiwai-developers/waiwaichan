import json from "@/config/config.json" with { type: "json" };
interface DiscordConfig {
	token: string;
	clientId: string;
	guildId: string;
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
	token: string;
	owner: string;
	repo: string;
}

interface GCPInstanceConfig {
	project: string;
	zone: string;
	instance: string;
}

interface AppConfigJson {
	discord: DiscordConfig;
	deepl: DeepLConfig;
	openai: OpenAIConfig;
	github: GithubConfig;
	gcp: GCPInstanceConfig;
	backend: {
		pointEmoji: string;
	};
}

export const AppConfig: AppConfigJson = json;