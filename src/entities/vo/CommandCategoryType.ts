import { ValueObject } from "./ValueObject";

export class CommandCategoryType extends ValueObject<number> {
	static Utility = new CommandCategoryType(1);
	static AI = new CommandCategoryType(2);
	static Reminder = new CommandCategoryType(3);
	static Candy = new CommandCategoryType(4);
	static Review = new CommandCategoryType(5);
	static Sticky = new CommandCategoryType(6);
	static Room = new CommandCategoryType(7);
	static Crown = new CommandCategoryType(8);
	static Role = new CommandCategoryType(9);
}
