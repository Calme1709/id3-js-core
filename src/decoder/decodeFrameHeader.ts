import { Buffer } from "buffer";
import { SynchsafeInteger, getIdentifierLength } from '@utils';

/**
 * Data that is stored in (and about) the header of a singular frame
 */
export interface IFrameHeader {
	/**
	 * The size of the header (this includes any flag data)
	 */
	headerSize: number;

	/**
	 * The size of the frame (including the header)
	 */
	frameSize: number;

	/**
	 * The identifier of this frame
	 */
	identifier: string;

	/**
	 * The flags that are associated with this frame
	 */
	flags?: IV3FrameFlags | IV4FrameFlags;
}

/**
 * The flags stored with a frame in a tag adhering to the ID3v2.3 spec
 */
export interface IV3FrameFlags {
	/**
	 * Whether this tag should be discarded on tag alteration.
	 *
	 * Default: false
	 */
	discardOnTagAlteration: boolean;

	/**
	 * Whether this tag should be discarded on file alteration
	 *
	 * Default: false excluding the following frames; ASPI, AENC, ETCO, EQUA, EQU2, MLLT, POSS, SEEK, SYLT, SYTC, RVAD,
	 * RVA2, TENC, TLEN, and TSIZ which default to true
	 */
	discardOnFileAlteration: boolean;

	/**
	 * Whether this frame is readonly
	 *
	 * Default: false
	 */
	readOnly: boolean;

	/**
	 * Whether this frame has undergone compression using zlib
	 *
	 * Default: false
	 */
	compression: boolean;

	/**
	 * Whether this frame is encrypted
	 */
	encryption: boolean;

	/**
	 * Whether this frame belongs in a group with other frames
	 */
	groupingIdentity: boolean;
}

/**
 * The flags stored with a frame in a tag adhering to the ID3v2.4 spec
 */
export interface IV4FrameFlags extends IV3FrameFlags {
	/**
	 * Whether this frame has undergone unsynchronisation
	 */
	unsynchronisation: boolean;

	/**
	 * Whether this frame has an attached data length indicator
	 */
	dataLengthIndicator: boolean;
}

/**
 * Decode and set data from the header
 * @param data - The buffer of the data to decode
 * @param ID3Version - The version of the ID3v2 spec to adhere to when decoding the header
 * @returns An object containing some information that was stored in, and about the header
 */
export default (data: Buffer, ID3Version: 2 | 3 | 4): IFrameHeader => {
	const identifierLength = getIdentifierLength(ID3Version);

	const identifier = data.slice(0, identifierLength).toString("latin1");
	const frameSize = SynchsafeInteger.decode(data.readIntBE(identifierLength, identifierLength));

	let headerSize = ID3Version === 2 ? 6 : 10;
	let decodedFlags: IV3FrameFlags | IV4FrameFlags | undefined;

	if(ID3Version > 2){
		const flags = data.readInt16BE(8).toString(2).split("").map(bit => bit === "1");

		decodedFlags = ID3Version === 3 ? {
			discardOnTagAlteration: flags[0],
			discardOnFileAlteration: flags[1],
			readOnly: flags[2],
			compression: flags[8],
			encryption: flags[9],
			groupingIdentity: flags[10]
		} : {
			discardOnTagAlteration: flags[1],
			discardOnFileAlteration: flags[2],
			readOnly: flags[3],
			groupingIdentity: flags[9],
			compression: flags[12],
			encryption: flags[13],
			unsynchronisation: flags[14],
			dataLengthIndicator: flags[15]
		};

		if(decodedFlags.groupingIdentity){
			headerSize += 1;
		}

		if(decodedFlags.compression && ID3Version === 3){
			headerSize += 4;
		}

		if(decodedFlags.encryption){
			headerSize += 1;
		}

		if((decodedFlags as IV4FrameFlags).dataLengthIndicator){
			headerSize += 4;
		}
	}

	return {
		headerSize,
		frameSize: frameSize + (ID3Version === 2 ? 6 : 10),
		identifier,
		flags: decodedFlags
	};
};