import type { ChoiceContent } from "@/entities/vo/ChoiceContent";
import type { DiceSides } from "@/entities/vo/DiceSides";
import type { HelpCategory } from "@/entities/vo/HelpCategory";
import type { ParrotMessage } from "@/entities/vo/ParrotMessage";
import type { IUtilityLogic } from "@/logics/Interfaces/logics/IUtilityLogic";

export class UtilityLogic implements IUtilityLogic {
	waiwai(): Promise<string> {
		throw new Error("Method not implemented.");
	}
	help(type: HelpCategory): Promise<string> {
		throw new Error("Method not implemented.");
	}
	choice(items: Array<ChoiceContent>): Promise<string> {
		throw new Error("Method not implemented.");
	}
	dice(sides: DiceSides): Promise<string> {
		throw new Error("Method not implemented.");
	}
	parrot(msg: ParrotMessage): Promise<string> {
		throw new Error("Method not implemented.");
	}
}
