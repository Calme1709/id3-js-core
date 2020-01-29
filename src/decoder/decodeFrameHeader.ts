import { Buffer } from "buffer";
import Utils from '../utils';

/**
 * The flags stored with a frame in a tag adhering to the ID3v2.3 spec
 */
export interface IV3FrameFlags {
	discardOnTagAlteration: boolean;
	discardOnFileAlteration: boolean;
	readOnly: boolean;
	compression: boolean;
	encryption: boolean;
	groupingIdentity: boolean;
}

/**
 * The flags stored with a frame in a tag adhering to the ID3v2.4 spec
 */
export interface IV4FrameFlags extends IV3FrameFlags {
	unsynchronisation: boolean;
	dataLengthIndicator: boolean;
}

/**
 * Decode and set data from the header
 * @param data - The buffer of the data to decode
 * @param ID3Version - The version of the ID3v2 spec to adhere to when decoding the header
 * @returns An object containing some information that was stored in, and about the header
 */
export default (data: Buffer, ID3Version: 2 | 3 | 4) => {
	const identifierLength = Utils.getIdentifierLength(ID3Version);

	const identifier = data.slice(0, identifierLength).toString("latin1");
	const frameSize = Utils.decodeSynchsafeInteger(data.readIntBE(identifierLength, identifierLength));

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