import { Buffer } from "buffer";
import { TextEncoding } from './encoder/encodingOptions';
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
	 * Get the length of the null byte depending on the type of encoding
	 * @param encodingType - The type of encoding
	 * @returns The length of the null byte
	 */
	public static getNullByteLength(encodingType: TextEncoding): 1 | 2;

	/**
	 * Get the length of the null byte depending on the number representation of the encoding type
	 * @param encodingByte - The byte specifying the type of encoding
	 * @returns The length of the null byte
	 */
	public static getNullByteLength(encodingByte: number) : 1 | 2;
	public static getNullByteLength(encoding: number | TextEncoding){
		const encodingType = typeof encoding === "string" ? encoding : this.getEncoding(encoding);

		switch(encodingType){
			case "utf16le":
			case "utf16be":
				return 2;
			case "latin1":
			case "utf8":
			default:
				return 1;
		}
	}

	/**
	 * Get the name of the encoding type depending on the encoding byte
	 * @param encodingByte - The byte that specifies the type of encoding
	 * @returns The name of the encoding type
	 */
	public static getEncoding(encodingByte: number): TextEncoding{
		switch(encodingByte){
			case 0x00:
				return "latin1";
			case 0x01:
				return "utf16le";
			case 0x02:
				return "utf16be";
			case 0x03:
				return "utf8";
			default:
				throw new Error(`Unrecognised text encoding byte: ${encodingByte}`);
		}
	}

	/**
	 * Get the byte representation of an encoding type
	 * @param encodingType - The encoding type to get the byte representation of
	 * @returns The byte representation
	 */
	public static getEncodingByte(encodingType: TextEncoding){
		switch(encodingType){
			case "latin1":
				return 0x00;
			case "utf16le":
				return 0x01;
			case "utf16be":
				return 0x02;
			case "utf8":
				return 0x03;
			default:
				throw new Error(`Unrecognised encoding type: ${encodingType}`);
		}
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
	 * Get the terminator byte(s) for the specified type of encoding
	 * @param encodingType - The type of encoding
	 * @returns The terminator byte(s)
	 */
	public static getTerminator(encodingType: TextEncoding): Buffer;

	/**
	 *  Get the terminator byte(s) for the specified type of encoding from the byte representation of the encoding type
	 * @param encodingByte - The byte specifying the type of encoding
	 * @returns The terminator byte(s)
	 */
	public static getTerminator(encodingByte: number): Buffer;
	public static getTerminator(encoding: TextEncoding | number){
		const encodingType = typeof encoding === "string" ? encoding : this.getEncoding(encoding);

		return this.getNullByteLength(encodingType) === 2 ?
			Buffer.from(new Uint8Array([ 0x00, 0x00 ])) :
			Buffer.from(new Uint8Array([ 0x00 ]));
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