import json from "../../../config/commands.json" with { type: "json" };
interface CommandType {
	name: string;
	example: string;
	parameter: string;
	description: string;
}
interface CommandsCategoryType {
	name: string;
	commands: CommandType[];
}
interface CommandsJsonType {
	categories: CommandsCategoryType[];
}

export const CommandsConfig: CommandsJsonType = json;
