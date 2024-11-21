import { CommandsConfig } from "@/src/entities/config/CommandsConfig";
import { ValueObject } from "./ValueObject";

export class HelpCategory extends ValueObject<string> {
	validator = (value: string) => {
		return CommandsConfig.categories.map((c) => c.name).includes(value);
	};
}
