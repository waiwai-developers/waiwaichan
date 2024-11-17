import type { ChoiceContent } from "@/entities/vo/ChoiceContent";
import type { DiceSides } from "@/entities/vo/DiceSides";
import type { HelpCategory } from "@/entities/vo/HelpCategory";
import type { ParrotMessage } from "@/entities/vo/ParrotMessage";

export interface IUtilityLogic {
	waiwai(): string;
	help(type: HelpCategory): string;
	choice(items: Array<ChoiceContent>): string;
	dice(sides: DiceSides): string;
	parrot(msg: ParrotMessage): string;
}
