export class ValueObject<T> {
	value: T;
	protected validator: (value: T) => boolean = (t) => true;
	constructor(value: T) {
		this.value = value;
	}
	getValue(): T {
		return this.value;
	}

	isValid(value: T): boolean {
		return this.validator(value);
	}
}
