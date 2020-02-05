import { remappedFrames } from "./data.json";

/**
 * Possible units that timestamps in an ID3 tag can be stored as
 */
export enum TimestampUnit {
	/**
	 * The timestamp format is absolute time, using MPEG frames as the unit
	 */
	MPEGFrames = 1,

	/**
	 * The timestamp format is absolute time, using milliseconds as the unit
	 */
	Milliseconds = 2
}

/**
 * A class containing a number of useful functions for the decoding of ID3 tags
 */
export default class Utils {
	/**
	 * Find the length of the frame identifier for the specified version of the ID3 spec
	 * @param ID3Version - The version of the ID3 spec to find the identifier length for
	 * @returns The length of the identifier in the described ID3v2 spec
	 */
	public static getIdentifierLength(ID3Version: number){
		return ID3Version > 2 ? 4 : 3;
	}

	/**
	 * Decode a timestamp unit from it's number notation (0x00 or 0x01) to it's language representation (Milliseconds
	 * or MPEG Frames respectively)
	 * @param unitByte - The number notation of the timestamp unit
	 * @returns The language representation of the tiemstamp unit
	 */
	public static decodeTimestampUnit(unitByte: number){
		return unitByte === 0x01 ? "MPEG Frames" : "Milliseconds";
	}

	/**
	 * Encode an integer to be synchsafe
	 * @param value - The value of the integer to encode
	 * @returns The encoded integer
	 */
	public static encodeSynchsafeInteger(value: number){
		let out = 0;
		let mask = 0x7F;

		// tslint:disable: no-bitwise
		while (mask ^ 0x7FFFFFFF) {
			out = value & ~mask;
			out <<= 1;
			out |= value & mask;
			mask = ((mask + 1) << 8) - 1;
			value = out;
		}

		return out;
	}

	/**
	 * Decode a synchsafe integer
	 * @param value - The synchsafe integer to decode
	 * @returns The decoded integer
	 */
	public static decodeSynchsafeInteger(value: number){
		let out = 0;
		let mask = 0x7F000000;

		while (mask) {
			out >>= 1;
			out |= value & mask;
			mask >>= 8;
		}

		return out;
	}

	/**
	 * Remap an identifier from it's 3 character version (ID3v2.2) to it's 4 character version (ID3v2.3+) or vice versa
	 * @param identifier - The identifier to remap
	 * @param targetID3Version - The target version to remap the identifier to
	 * @returns The remapped identifier
	 */
	public static getCorrectIdentifier(identifier: string, targetID3Version: 2 | 3 | 4){
		const originalID3Version = identifier.length === 3 ? 2 : 3;

		if(originalID3Version === 3 && targetID3Version === 4 || originalID3Version === targetID3Version){
			return identifier;
		}

		const positionInRemapArray = originalID3Version > 2 ? 1 : 0;

		for(const remap of remappedFrames){
			if(remap[positionInRemapArray] === identifier){
				return remap[positionInRemapArray === 0 ? 1 : 0];
			}
		}

		throw new Error(`Cannot remap the identifier (${identifier} from version ${originalID3Version} to version ${targetID3Version})`);
	}
}