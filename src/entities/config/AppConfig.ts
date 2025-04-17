import json from "../../../config/config.json" with { type: "json" };
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

interface AppConfigJson {
	discord: DiscordConfig;
	deepl: DeepLConfig;
	openai: OpenAIConfig;
	github: GithubConfig;
	gcp: GCPInstanceConfig;
	backend: {
		candyEmoji: string;
		candyBigEmoji: string;
		candyLogChannel: string;
	};
}

export const AppConfig: AppConfigJson = json;
