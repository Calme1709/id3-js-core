import { Buffer } from "buffer";
import Utils from "../utils";

/**
 * The data that is stored in the header of a tag regardless of which version of the spec it is following
 */
interface IHeader {
	/**
	 * Whether this tag has undergone unsynchronisation
	 */
	unsynchronisation: boolean;

	/**
	 * This is the size of the tag excluding the header, the extended header, and the footer
	 */
	tagSize: number;

	/**
	 * This is the size of the header and the extended header (if it is present)
	 */
	headerSize: number;
}

/**
 * The data that can be stored in the header of a tag that is following the ID3v2.2 spec
 */
export interface IV2Header extends IHeader {
	version: 2;
	compression: boolean;
}

/**
 * The data that can be stored in the header of a tag that is following the ID3v2.3 spec
 */
export interface IV3Header extends IHeader {
	version: 3;
	experimental: boolean;
	crcData?: number;
	paddingSize?: number;
}

/**
 * The restrictions that can be placed upon a tag
 */
interface ITagRestrictions {
	/**
	 * Restrictions on the size of the tag;
	 *
	 * 0 - No more than 128 frames and 1 MB total tag size.
	 *
	 * 1 - No more than 64 frames and 128 KB total tag size.
	 *
	 * 2 - No more than 32 frames and 40 KB total tag size.
	 *
	 * 3 - No more than 32 frames and 4 KB total tag size.
	 */
	tagSize: 0 | 1 | 2 | 3;

	/**
	 * Restrictions on the type's of text encoding in this tag;
	 *
	 * 0 - No restrictions
	 *
	 * 1 - Strings are only encoded with ISO-8859-1 [ISO-8859-1] or UTF-8 [UTF-8].
	 */
	textEncoding: 0 | 1;

	/**
	 * 	Restrictions on the length of text strings in this tag;
	 *
	 * 0 - No restrictions.
	 *
	 * 1 - No string is longer than 1024 characters.
	 *
	 * 2 - No string is longer than 128 characters.
	 *
	 * 3 - No string is longer than 30 characters.
	 */
	textFieldSize: 0 | 1 | 2 | 3;

	/**
	 * Restrictions on the image encoding that is used in this tag;
	 *
	 * 0 - No restrictions.
	 *
	 * 1 - Images are encoded only with PNG [PNG] or JPEG [JFIF].
	 */
	imageEncoding: 0 | 1;

	/**
	 * Restrictions on the sizes of images in this tag;
	 *
	 * 0 -No restrictions.
	 *
	 * 1 - All images are 256x256 pixels or smaller.
	 *
	 * 2 - All images are 64x64 pixels or smaller.
	 *
	 * 3 - All images are exactly 64x64 pixels, unless required otherwise.
	 */
	imageSize: 0 | 1 | 2 | 3;
}

/**
 * The data that is stored in the header of a tag that is following the ID3v2.4 spec
 */
export interface IV4Header extends IHeader {
	version: 4;
	experimental: boolean;
	footerPresent: boolean;
	crcData?: number;
	tagIsAnUpdate?: boolean;

	/**
	 * These are restrictions that were present when the tag was last encoded
	 */
	tagRestrictions?: ITagRestrictions;
}

export default (data: Buffer): IV2Header | IV3Header | IV4Header => {
	const version = data[3];
	const tagSize = Utils.decodeSynchsafeInteger(version === 2 ? data.readIntBE(6, 3) : data.readInt32BE(6));

	const flags = data[5].toString(2).split("").map(bit => bit === "1");

	switch(version){
		case 2: {
			return {
				version: 2,
				headerSize: 10,
				tagSize: tagSize + 10,
				unsynchronisation: flags[0],
				compression: flags[1]
			};
		} case 3: {
			let headerSize = 10;
			let crcData: number | undefined;
			let paddingSize: number | undefined;

			if(flags[1]){
				headerSize += Utils.decodeSynchsafeInteger(data.readInt32BE(10)) + 4;

				paddingSize = Utils.decodeSynchsafeInteger(data.readInt32BE(14));

				const extendedFlags = data.readInt16BE(14).toString(2).split("").map(bit => bit === "1");

				if(extendedFlags[0]){
					crcData = data.readInt32BE(20);
				}
			}

			return {
				version: 3,
				crcData,
				headerSize,
				tagSize: tagSize + 10,
				paddingSize,
				unsynchronisation: flags[0],
				experimental: flags[2]
			};
		} case 4: {
			let headerSize = 10;
			let crcData: number | undefined;
			let tagIsAnUpdate: boolean | undefined;
			let tagRestrictions: ITagRestrictions | undefined;

			if(flags[1]){
				let flagDataOffset = 16;

				headerSize += Utils.decodeSynchsafeInteger(data.readInt32BE(10)) + 4;

				const extendedFlags = data[15].toString(2).split("").map(bit => bit === "1");

				tagIsAnUpdate = extendedFlags[0];

				if(extendedFlags[1]){
					crcData = Utils.decodeSynchsafeInteger(data.readIntBE(flagDataOffset, 5));

					flagDataOffset += 5;
				}

				if(extendedFlags[2]){
					const restrictionsByte = data[flagDataOffset].toString(2);

					tagRestrictions = {
						tagSize: parseInt(restrictionsByte.substr(0, 2), 2) as 0 | 1 | 2 | 3,
						textEncoding: parseInt(restrictionsByte[2], 2) as 0 | 1,
						textFieldSize: parseInt(restrictionsByte.substr(3, 2), 2) as 0 | 1 | 2 | 3,
						imageEncoding: parseInt(restrictionsByte[5], 2) as 0 | 1,
						imageSize: parseInt(restrictionsByte.substr(6, 2), 2) as 0 | 1 | 2 | 3
					};
				}
			}

			return {
				version: 4,
				unsynchronisation: flags[0],
				tagSize: tagSize + 10,
				experimental: flags[2],
				footerPresent: flags[3],
				headerSize,
				crcData,
				tagIsAnUpdate,
				tagRestrictions
			};
		}
		default:
			throw new Error(`Invalid ID3 version: ${version}`);
	}
};