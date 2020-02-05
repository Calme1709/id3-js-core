import { Buffer } from 'buffer';
import { IVersionSupport } from '@encoder/isVersionSupported';
import { IEncodingOptions } from '@encoder/encodingOptions';
import { IV3FrameFlags, IV4FrameFlags } from '@decoder/decodeFrameHeader';
import { framesToBeDiscardedOnFileAlter } from "@data";
import { getCorrectIdentifier } from '@utils';

/**
 * A class for managing the frame flags
 */
export default class FrameFlagManager {
	public flags?: IV3FrameFlags | IV4FrameFlags;

	/**
	 * Test if a specific version of the ID3v2 spec is supported depending on the flags that are set
	 * @param version - The version to test
	 * @returns - Whether the version is supported and if it is not; the reason it is not
	 */
	public supportsVersion(version: number): IVersionSupport{
		switch(version){
			case 2:
				if(this.getBinaryRepresentation(4) !== "0".repeat(16)){
					return {
						supportsVersion: false,
						reason: "There are flags set, this is not supported in ID3v2.2"
					};
				}

				return {
					supportsVersion: true,
					reason: ""
				};

			case 3:
				if((this.flags as IV4FrameFlags)?.unsynchronisation){
					return {
						supportsVersion: false,
						reason: "The unsynchronisation flag is set, this is only supported in ID3v2.4"
					};
				}

				if((this.flags as IV4FrameFlags)?.dataLengthIndicator){
					return {
						supportsVersion: false,
						reason: "The data length indicator flag is set, this is only supported in ID3v2.4"
					};
				}

				return {
					supportsVersion: true,
					reason: ""
				};

			case 4:
				return {
					supportsVersion: true,
					reason: ""
				};

			default:
				throw new Error(`Invalid ID3 version ${version}`);
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
			discardOnFileAlteration: framesToBeDiscardedOnFileAlter.includes(getCorrectIdentifier(identifier, 3)),
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
