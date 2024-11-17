import type { HelpCategory } from "@/entities/vo/HelpCategory";

export interface IUtilityLogics {
	waiwai(): string;
	help(type: HelpCategory): string;
	choise(): string;
	dice(): string;
	parrot(): string;
}
