class ValueObject<T> {
	value: T;
	protected validator: (value: T) => boolean;
	constructor(value: T) {
		this.value = value;
	}
	getValue(): T {
		return this.value;
	}

	isValid(value: T): boolean {
		if (this.validator == null) {
			return true;
		}
		return this.validator(value);
	}
}
