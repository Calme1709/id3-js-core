import { ITagHeader } from "./utils";
import { decodeSize } from "../../utils";

/**
 * The flags that are stored in a version 2.3.x header
 */
interface IV3HeaderFlags {
	unsynchronisation: boolean;
	extendedHeaderPresent: boolean;
	experimental: boolean;
}

/**
 * The information stored in an extended header in version 2.3.x
 */
interface IV3ExtendedHeader {
	size: number;
	sizeOfPadding: number;
	flags: {
		crc: {
			present: boolean;
			data?: number[];
		};
	};
}

/**
 * The information stored in a ID3v2.3.x tag
 */
export interface IV3TagInformation {
	header: ITagHeader<3, IV3HeaderFlags>;
	extendedHeader?: IV3ExtendedHeader;
}

/**
 * The decoder for ID3v2.3.x
 */
export default class V3 {
	/**
	 * Decode the tag from a buffer that is version ID3v2.3.x
	 * @param buffer - The buffer containing the tag
	 * @returns - The decoded tag
	 */
	public static decode(buffer: Buffer): IV3TagInformation{
		const tagOffset = buffer.indexOf("ID3");

		const headerBuffer = buffer.subarray(tagOffset, tagOffset + 10);

		const headerData = this.decodeHeader(headerBuffer);

		const bodyBuffer = buffer.subarray(tagOffset + 10, tagOffset + headerData.tagSize + 10);

		return {
			header: headerData,
			extendedHeader: headerData.flags.extendedHeaderPresent ? this.decodeExtendedHeader(bodyBuffer) : undefined
		};
	}

	/**
	 * Decode the tag header of an ID3v2.3.x tag
	 * @param headerBuffer - The buffer containing the header
	 * @returns The decoded header
	 */
	public static decodeHeader(headerBuffer: Buffer): ITagHeader<3, IV3HeaderFlags>{
		const flagByte = headerBuffer[5].toString(2).padStart(8, "0");

		return {
			majorVersion: 3,
			revisionVersion: headerBuffer[4],
			tagSize: decodeSize(headerBuffer.subarray(6, 10)),
			flags: {
				unsynchronisation: flagByte[0] === "1",
				extendedHeaderPresent: flagByte[1] === "1",
				experimental: flagByte[2] === "1"
			}
		};
	}

	/**
	 * Decode the extended header of the ID3 tag
	 * @param bodyBuffer - The body of the ID3 tag (the tag excluding the header)
	 * @returns The decoded extended header
	 */
	public static decodeExtendedHeader(bodyBuffer: Buffer): IV3ExtendedHeader{
		const flagByte = bodyBuffer[4].toString(2).padStart(8, "0");

		return {
			size: decodeSize(bodyBuffer.subarray(0, 4)),
			sizeOfPadding: decodeSize(bodyBuffer.subarray(6, 10)),
			flags: {
				crc: {
					present: flagByte[0] === "1",
					data: flagByte[0] === "1" ? [
						bodyBuffer[10],
						bodyBuffer[11],
						bodyBuffer[12],
						bodyBuffer[13]
					] : undefined
				}
			}
		};
	}
}