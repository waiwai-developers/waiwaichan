import { CommandsConfig } from "@/src/entities/config/CommandsConfig";
import type { ChoiceContent } from "@/src/entities/vo/ChoiceContent";
import type { DiceSides } from "@/src/entities/vo/DiceSides";
import type { HelpCategory } from "@/src/entities/vo/HelpCategory";
import type { ParrotMessage } from "@/src/entities/vo/ParrotMessage";
import type { IUtilityLogic } from "@/src/logics/Interfaces/logics/IUtilityLogic";
import { injectable } from "inversify";

@injectable()
export class UtilityLogic implements IUtilityLogic {
	async waiwai(): Promise<string> {
		return "waiwai";
	}
	async help(type: HelpCategory): Promise<string> {
		const texts = CommandsConfig.categories
			.filter((c) => type.getValue() === "all" || c.name === type.getValue())
			.flatMap((c) => [
				`## ${c.name}`,
				...c.commands.flatMap((command) => [
					`- \`${command.name}\``,
					...(type.getValue() !== "all"
						? [
								`  - 値　　： ${command.parameter}`,
								`  - 例　　： ${command.example}`,
								`  - 説明　： ${command.description}`,
							]
						: []),
				]),
			]);
		return texts.join("\n");
	}
	async choice(items: Array<ChoiceContent>): Promise<string> {
		if (items.length <= 0) return "パラメーターがないよ！っ";

		return items[Math.floor(Math.random() * Number(items.length))]?.getValue();
	}
	async dice(sides: DiceSides): Promise<string> {
		if (sides == null) return "パラメーターがないよ！っ";
		if (!Number.isInteger(sides.getValue()))
			return "パラメーターが整数じゃないよ！っ";
		if (sides.getValue() <= 0) return "パラメーターが0以下の数だよ！っ";

		return Math.floor(Math.random() * sides.getValue() + 1).toString(10);
	}
	async parrot(msg: ParrotMessage): Promise<string> {
		if (!msg) return "パラメーターがないよ！っ";

		return msg.getValue();
	}
}
