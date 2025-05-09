import type { ChoiceContent } from "@/src/entities/vo/ChoiceContent";
import type { DiceSides } from "@/src/entities/vo/DiceSides";
import type { HelpCategory } from "@/src/entities/vo/HelpCategory";
import type { ParrotMessage } from "@/src/entities/vo/ParrotMessage";

export interface IUtilityLogic {
	waiwai(): Promise<string>;
	help(type: HelpCategory): Promise<string>;
	choice(items: Array<ChoiceContent>): Promise<string>;
	dice(sides: DiceSides): Promise<string>;
	parrot(msg: ParrotMessage): Promise<string>;
}
