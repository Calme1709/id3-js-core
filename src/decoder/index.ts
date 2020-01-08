import {
	V2Decoder,
	V3Decoder,
	V4Decoder
} from "./versionDecoders";

/**
 * Top level class used for the decoding of ID3v2 tags
 */
export default abstract class TagDecoder {
	/**
	 * Decode a buffer that includes ID3 data
	 * @param data - The buffer that contains the file data
	 * @returns The decoded ID3 data
	 */
	public static decode(data: Buffer){
		const tagOffset = data.indexOf("ID3");

		if(tagOffset === -1){
			//File does not include ID3 tags
			return undefined;
		}

		const version = data[tagOffset + 4];

		return this.getDecoder(version).decode(data);
	}

	/**
	 * Get the decoder for the passed version
	 * @param version - The ID3 version to get the decoder for
	 * @returns The decoder
	 */
	private static getDecoder(version: number){
		switch(version){
			case 2:
				return V2Decoder;
			case 3:
				return V3Decoder;
			case 4:
				return V4Decoder;
			default:
				throw new Error("Invalid ID3 version");
		}
	}
}