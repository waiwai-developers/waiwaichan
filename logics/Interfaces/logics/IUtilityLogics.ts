import type { HelpCategory } from "@/entities/vo/HelpCategory";

interface IUtilityLogics {
	waiwai(): string;
	help(type: HelpCategory): string;
	dice(): string;
	parrot(): string;
}
