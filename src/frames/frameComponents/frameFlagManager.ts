import { IV3FrameFlags, IV4FrameFlags } from '../../types';
import Utils from '../../utils';
import { IEncodingOptions } from '../../encodingOptions';
import { Buffer } from 'buffer';

/**
 * A class for managing the frame flags
 */
export default class FrameFlagManager {
	public flags?: IV3FrameFlags | IV4FrameFlags;

	public get supportedVersions(){
		//If none of the frame format flags are specified are set then technically
		//ID3v2 can technically be supported by excluding all of the flags
		if(this.getBinaryRepresentation(4).substring(9) === "0".repeat(7)){
			return [ 2, 3, 4 ];
		} else if((this.flags === undefined || !("dataLengthIndicator" in this.flags)) || (!this.flags.dataLengthIndicator && !this.flags.unsynchronisation)){
			return [ 3, 4 ];
		} else {
			return [ 4 ];
		}
	}

	/**
	 * Set the flags to their default depending on the frame that they are associated with
	 * and the version of the ID3v2 spec to adhere to
	 * @param identifier - The identifier
	 * @param ID3Version - The version of the ID3v2 spec to adhere to
	 */
	public setDefaultFlags(identifier: string, ID3Version: 3 | 4){
		const framesToBeDiscardedOnFileAlter = [
			"ASPI",
			"AENC",
			"ETCO",
			"EQUA",
			"EQU2",
			"MLLT",
			"POSS",
			"SEEK",
			"SYLT",
			"SYTC",
			"RVAD",
			"RVA2",
			"TENC",
			"TLEN",
			"TSIZ"
		];

		const defaultFlags: IV3FrameFlags = {
			discardOnFileAlteration: framesToBeDiscardedOnFileAlter.includes(Utils.getCorrectIdentifier(identifier, 3)),
			discardOnTagAlteration: false,
			readOnly: false,
			compression: false,
			encryption: false,
			groupingIdentity: false
		};

		switch(ID3Version){
			case 3:
				this.flags = defaultFlags;

				break;
			case 4:
				this.flags = {
					...defaultFlags,
					unsynchronisation: false,
					dataLengthIndicator: false
				};

				break;
			default:
				throw new Error(`Invalid ID3v2 version for flags: ${ID3Version}`);
		}
	}

	/**
	 * Decode a flag buffer and set the flags accordingly
	 * @param flagBuffer - The two byte buffer to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag this flag buffer was extracted from is following
	 */
	public setFlags(flagBuffer: Buffer, ID3Version: 3 | 4): void;

	/**
	 * Set the flags to a user defined object
	 * @param flags - The flags to set
	 */
	public setFlags(flags: IV3FrameFlags | IV4FrameFlags | undefined): void;
	public setFlags(flagsOrBuffer: Buffer | IV3FrameFlags | IV4FrameFlags | undefined, ID3Version?: 3 | 4){
		if(flagsOrBuffer instanceof Buffer){
			const flags = flagsOrBuffer.readInt16BE(0).toString(2).split("").map(bit => bit === "1");

			this.flags = ID3Version === 3 ? {
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
		} else {
			this.flags = flagsOrBuffer;
		}
	}

	/**
	 * Encode the flags associated with this into a buffer
	 * @param encodingOptions - The options to use when encoding these flags
	 * @returns The encoded flags
	 */
	public encode(encodingOptions: IEncodingOptions){
		const retBuf = Buffer.alloc(2, 0);

		retBuf.writeInt16BE(parseInt(this.getBinaryRepresentation(encodingOptions.ID3Version as 3 | 4), 2), 0);

		return retBuf;
	}

	/**
	 * Get a binary representation of the flags
	 * @param ID3Version - The version of the ID3v2 spec to adhere to when crafting the binary representation
	 * @returns A string containing the binary representation
	 */
	private getBinaryRepresentation(ID3Version: 3 | 4){
		if(this.flags === undefined){
			return "0".repeat(16);
		}

		if(ID3Version === 3){
			return `
				${this.flags.discardOnTagAlteration ? "0" : "1"}
				${this.flags.discardOnFileAlteration ? "0" : "1"}
				${this.flags.readOnly ? "1" : "0"}
				${"0".repeat(5)}
				${this.flags.compression ? "1" : "0"}
				${this.flags.encryption ? "1" : "0"}
				${this.flags.groupingIdentity ? "1" : "0"}
				${"0".repeat(5)}
			`;
		}

		return `
			0
			${this.flags.discardOnTagAlteration ? "1" : "0"}
			${this.flags.discardOnFileAlteration ? "1" : "0"}
			${this.flags.readOnly ? "1" : "0"}
			${"0".repeat(5)}
			${this.flags.groupingIdentity ? "1" : "0"}
			${"0".repeat(2)}
			${this.flags.compression ? "1" : "0"}
			${this.flags.encryption ? "1" : "0"}
			${(this.flags as IV4FrameFlags).unsynchronisation ? "1" : "0"}
			${(this.flags as IV4FrameFlags).dataLengthIndicator ? "1" : "0"}
		`;
	}
}
