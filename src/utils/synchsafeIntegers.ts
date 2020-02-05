/**
 * A class to handle the interraction with synchsafe integers
 */
export default class SynchsafeInteger {
	/**
	 * Encode a number to be synchsafe
	 * @param value - The number to encode
	 * @returns The encoded number
	 */
	public static encode(value: number){
		let val = value;
		let out = 0;
		let mask = 0x7F;

		// tslint:disable: no-bitwise
		while (mask ^ 0x7FFFFFFF) {
			out = val & ~mask;
			out <<= 1;
			out |= val & mask;
			mask = ((mask + 1) << 8) - 1;
			val = out;
		}

		return out;
	}

	/**
	 * Decode a synchsafe integer
	 * @param value - The value of the synchsafe integer
	 * @returns The non-synchsafe integer
	 */
	public static decode(value: number){
		let out = 0;
		let mask = 0x7F000000;

		while (mask) {
			out >>= 1;
			out |= value & mask;
			mask >>= 8;
		}

		return out;
	}
}