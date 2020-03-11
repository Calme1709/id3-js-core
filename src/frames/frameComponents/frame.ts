import { Buffer } from "buffer";
import { IEncodingOptions } from '@encoder/encodingOptions';
import { IVersionSupport } from '@encoder/isVersionSupported';
import decodeFrameHeader, { IV3FrameFlags, IV4FrameFlags } from "@decoder/decodeFrameHeader";
import { SynchsafeInteger, getCorrectIdentifier } from "@utils";
import FrameFlagManager from './frameFlagManager';

/**
 * The base class that all frames derive from
 */
export default abstract class Frame {
	public identifier = "";
	// tslint:disable-next-line: no-any
	public abstract value: any;

	private readonly flagManager = new FrameFlagManager();

	set flags(flags: IV3FrameFlags | IV4FrameFlags | undefined){
		this.flagManager.flags = flags;
	}

	get flags(){
		return this.flagManager.flags;
	}

	/**
	 * Test if this frame can be encoded with a specified version
	 * @param version - The version to test
	 * @returns Whether this frame can be encoded with the specified version, and if not; the reason it cannot
	 */
	public supportsVersion(version: number): IVersionSupport{
		const flagManagerSupportsVersion = this.flagManager.supportsVersion(version);
		const contentSupportsVersion = this.contentSupportsVersion(version);

		if(flagManagerSupportsVersion.supportsVersion && contentSupportsVersion.supportsVersion){
			return {
				supportsVersion: true,
				reason: ""
			};
		}

		if(!flagManagerSupportsVersion){
			return flagManagerSupportsVersion;
		}

		return contentSupportsVersion;
	}

	/**
	 * Encode the frame into a buffer
	 * @param ID3Version - The version to encode for
	 * @returns The encoded frame
	 */
	public abstract encodeContent(encodingOptions: IEncodingOptions): Buffer;

	/**
	 * Decode and set data from the header
	 * @param data - The buffer of the data to decode
	 * @param ID3Version - The version of the ID3v2 spec to adhere to when decoding the header
	 * @returns An object containing some information that was stored in, and about the header
	 */
	public decodeHeader(data: Buffer, ID3Version: 2 | 3 | 4){
		const headerInfo = decodeFrameHeader(data, ID3Version);

		this.identifier = headerInfo.identifier;
		this.flagManager.flags = headerInfo.flags;

		return headerInfo;
	}

	/**
	 * Encode the frame
	 * @param encodingOptions - The options used to encode this frame
	 * @returns The encoded frame
	 */
	public encode(encodingOptions: IEncodingOptions){
		const contentBuffer = this.encodeContent(encodingOptions);

		const identifier = getCorrectIdentifier(this.identifier, encodingOptions.ID3Version);

		if(encodingOptions.ID3Version === 2){
			const headerBuffer = Buffer.alloc(6, 0);

			headerBuffer.write(identifier, 0, 3, "latin1");
			headerBuffer.writeUIntBE(SynchsafeInteger.encode(contentBuffer.length), 3, 3);

			return Buffer.concat([
				headerBuffer,
				contentBuffer
			]);
		} else {
			const headerBuffer = Buffer.alloc(8, 0);
			headerBuffer.write(identifier);
			headerBuffer.writeUInt32BE(SynchsafeInteger.encode(contentBuffer.length), 4);

			if(this.flagManager.flags === undefined){
				this.flagManager.setDefaultFlags(identifier, encodingOptions.ID3Version);
			}

			return Buffer.concat([
				headerBuffer,
				this.flagManager.encode(encodingOptions),
				contentBuffer
			]);
		}
	}

	/**
	 * Get a string representation of the frame
	 * @returns The string representation of the frame
	 */
	public toString(){
		return `${this.identifier}: ${JSON.stringify(this.value)}`;
	}

	/**
	 * Check if the specified version can be used to encode the content of this frame
	 * @param version - The version to test
	 * @returns Whether the specified version can be used
	 */
	protected abstract contentSupportsVersion(version: number): IVersionSupport;
}