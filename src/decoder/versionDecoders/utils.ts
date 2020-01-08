/**
 * The header stored in an ID3 tag
 */
export interface ITagHeader<version, FlagType> {
	majorVersion: version;
	revisionVersion: number;
	tagSize: number;
	flags: FlagType;
}

/**
 * A class containing a number of useful functions for the decoding of ID3 tags
 */
export default class Utils {
	/**
	 * Get the length of the null byte depending on the type of encoding
	 * @param encodingByte - The byte specifying the type of encoding
	 * @returns The length of the null byte
	 */
	public static getNullByteLength(encodingByte: number){
		switch(encodingByte){
			case 0x01:
			case 0x02:
				return 2;
			case 0x00:
			case 0x03:
			default:
				return 1;
		}
	}

	/**
	 * Get the name of the encoding type depending on the encoding byte
	 * @param encodingByte - The byte that specifies the type of encoding
	 * @returns The name of the encoding type
	 */
	public static getEncoding(encodingByte: number){
		switch(encodingByte){
			case 0x01:
				return "UTF-16";
			case 0x02:
				return "UTF-16BE";
			case 0x03:
				return "UTF-8";
			case 0x00:
			default:
				return "ISO-8859-1";
		}
	}

	/**
	 * Find the index of the first double zero byte in a buffer
	 * @param body - The body to search through
	 * @returns The index of the first double zero byte
	 */
	public static indexOfDoubleZeroByte(body: Buffer, offset = 0){
		let currentIndex = body.indexOf(0x00, offset);

		while(currentIndex !== -1){
			if(body[currentIndex + 1] === 0x00){
				return currentIndex;
			}

			currentIndex = body.indexOf(0x00, currentIndex + 1);
		}

		return -1;
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
}