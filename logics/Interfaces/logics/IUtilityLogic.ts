import type { ChoiceContent } from "@/entities/vo/ChoiceContent";
import type { DiceSides } from "@/entities/vo/DiceSides";
import type { HelpCategory } from "@/entities/vo/HelpCategory";
import type { ParrotMessage } from "@/entities/vo/ParrotMessage";

export interface IUtilityLogic {
	waiwai(): Promise<string>;
	help(type: HelpCategory): Promise<string>;
	choice(items: Array<ChoiceContent>): Promise<string>;
	dice(sides: DiceSides): Promise<string>;
	parrot(msg: ParrotMessage): Promise<string>;
}
