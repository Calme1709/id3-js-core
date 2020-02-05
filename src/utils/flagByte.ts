/**
 * A class that handles all of the logic for encoding and decoding flag bytes
 */
export default class FlagByte {
	/**
	 * Encode an array of flags into a byte
	 * @param flags - The flags to encode
	 * @param byteCount - The amount of bytes that this should be encoded into
	 * @returns The encoded flag byte
	 */
	public static encode(flags: boolean[], byteCount = 1){
		return parseInt(flags.map(flag => flag ? "1" : "0").join("").padEnd(byteCount * 8, "0"), 2);
	}

	/**
	 * Decode a flag byte(s) into it's booleans
	 * @param flagByte - The flag byte(s)
	 * @param byteCount - The amount of bytes that are passed
	 * @returns The decoded flags
	 */
	public static decode(flagByte: number, byteCount = 1){
		return flagByte.toString(2).padStart(byteCount * 8, "0").split("").map(char => char === "1");
	}
}