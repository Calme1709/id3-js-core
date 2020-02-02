import Utils from '../../utils';
import { IEncodingOptions } from '../../encodingOptions';
import { Buffer } from 'buffer';
import { IV3FrameFlags, IV4FrameFlags } from '../../decoder/decodeFrameHeader';
import { framesToBeDiscardedOnFileAlter } from "../../data.json";

/**
 * A class for managing the frame flags
 */
export default class FrameFlagManager {
	public flags?: IV3FrameFlags | IV4FrameFlags;

	public get supportedVersions(){
		//If none of the frame format flags are specified are set then technically
		//ID3v2 can technically be supported by excluding all of the flags
		if(this.flags === undefined || this.getBinaryRepresentation(4).substring(9) === "0".repeat(7)){
			return [ 2, 3, 4 ];
		} else if(!("dataLengthIndicator" in this.flags) || !(this.flags.dataLengthIndicator || this.flags.unsynchronisation)){
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
