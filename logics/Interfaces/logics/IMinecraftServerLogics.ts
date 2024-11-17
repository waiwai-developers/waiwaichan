import type { DiceSides } from "@/entities/vo/DiceSides";
import type { HelpCategory } from "@/entities/vo/HelpCategory";

interface IMinecraftServerLogics {
	startServer(): string;
	stopServer(): string;
}
