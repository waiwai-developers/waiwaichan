export class ValueObject<T> {
	private readonly value: T;
	protected validator: (value: T) => boolean = (t) => true;
	constructor(value: T) {
		this.value = value;
	}
	getValue(): T {
		return this.value;
	}

	isValid(): boolean {
		return this.validator(this.value);
	}
}
