import { ITagHeader } from "./utils";
import { decodeSize } from "../../utils";

/**
 * The flags stored in the header of a ID3v2.4.x tag.
 */
interface IV4HeaderFlags {
	unsynchronisation: boolean;
	extendedHeaderPresent: boolean;
	experimental: boolean;
	footerPresent: boolean;
}

/**
 * The data stored in the extended header of an ID3v2.4.x tag
 */
interface IV4ExtendedHeader {
	size: number;
	flags: {
		tagIsUpdate: boolean;
		crc: {
			present: boolean;
			data?: number[];
		};
		restrictions?: {
			tagSize: number;
			textEncoding: number;
			textSize: number;
			imageEncoding: number;
			imageSize: number;
		};
	};
}

/**
 * The information stored in a ID3v2.4.x tag
 */
export interface IV4TagInformation {
	header: ITagHeader<4, IV4HeaderFlags>;
	extendedHeader?: IV4ExtendedHeader;
}

/**
 * The decoder for ID3v2.4.x
 */
export default class V4 {
	/**
	 * Decode the tag from a buffer that is version ID3v2.4.x
	 * @param buffer - The buffer containing the tag
	 * @returns - The decoded tag
	 */
	public static decode(buffer: Buffer): IV4TagInformation{
		const tagOffset = buffer.indexOf("ID3");

		const headerData = this.decodeHeader(buffer.subarray(tagOffset, tagOffset + 10));

		const extendedHeader = headerData.flags.extendedHeaderPresent ?
			this.decodeExtendedHeader(buffer.subarray(tagOffset + 10, tagOffset + 26)) :
			undefined;

		const extendedHeaderLength = extendedHeader !== undefined ? extendedHeader.size : 0;

		const bodyStart = tagOffset + 10 + extendedHeaderLength;

		const frames = this.decodeFrames(buffer.subarray(bodyStart, bodyStart + headerData.tagSize));

		return {
			header: headerData,
			extendedHeader
		};
	}

	/**
	 * Decode the tag header of an ID3v2.4.x tag
	 * @param headerBuffer - The buffer containing the header
	 * @returns The decoded header
	 */
	public static decodeHeader(headerBuffer: Buffer): ITagHeader<4, IV4HeaderFlags>{
		const flagByte = headerBuffer[5].toString(2).padStart(8, "0");

		return {
			majorVersion: 4,
			revisionVersion: headerBuffer[4],
			tagSize: decodeSize(headerBuffer.subarray(6, 10)),
			flags: {
				unsynchronisation: flagByte[0] === "1",
				extendedHeaderPresent: flagByte[1] === "1",
				experimental: flagByte[2] === "1",
				footerPresent: flagByte[3] === "1"
			}
		};
	}

	/**
	 * Decode the extended header of the ID3 tag
	 * @param bodyBuffer - The body of the ID3 tag (the tag excluding the header)
	 * @returns The decoded extended header
	 */
	public static decodeExtendedHeader(bodyBuffer: Buffer): IV4ExtendedHeader{
		const flagByte = bodyBuffer[5].toString(2).padStart(8, "0");
		const restrictionFlagByte = bodyBuffer[flagByte[2] === "1" ? 11 : 6].toString(2).padStart(8, "0");

		return {
			size: decodeSize(bodyBuffer.subarray(0, 4)),
			flags: {
				tagIsUpdate: flagByte[1] === "1",
				crc: {
					present: flagByte[2] === "1",
					data: flagByte[2] === "1" ? [ bodyBuffer[6], bodyBuffer[7], bodyBuffer[8], bodyBuffer[9], bodyBuffer[10] ] : undefined
				},
				restrictions: flagByte[3] === "1" ? {
					tagSize: parseInt(restrictionFlagByte.substr(0, 2), 2),
					textEncoding: parseInt(restrictionFlagByte[2], 2),
					textSize: parseInt(restrictionFlagByte.substr(3, 2), 2),
					imageEncoding: parseInt(restrictionFlagByte[5], 2),
					imageSize: parseInt(restrictionFlagByte.substr(6, 2), 2)
				} : undefined
			}
		};
	}
}