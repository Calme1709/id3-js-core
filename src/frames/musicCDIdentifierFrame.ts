import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';

/**
 * A music cd identifier frame
 */
export default class MusicCDIdentifierFrame extends Frame {
	/**
	 * The type of frame
	 */
	public frameType = "MUSICCDIDENTIFIERFRAME";

	/**
	 * The identifier of this frame
	 */
	public identifier!: string;

	/**
	 * The value of this text frame
	 */
	public value: Buffer;

	/**
	 * Decode a music cd identifier frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new music cd identifier frame
	 * @param identifier - The identifier of this frame
	 * @param value - The value of this text information frame
	 */
	public constructor(value: Buffer);
	public constructor(dataOrValue: Buffer, ID3Version?: number){
		super();

		if(ID3Version !== undefined){
			const headerInfo = this.decodeHeader(dataOrValue, ID3Version as 2 | 3 | 4);

			this.value = dataOrValue.slice(headerInfo.headerSize);
		} else {
			this.identifier = "MCDI";

			this.value = dataOrValue;
		}
	}

	/**
	 * Encode the content of the frame
	 * @param encodingOptions - The encoding options to encode with
	 * @returns The encoded content
	 */
	public encodeContent(){
		return this.value;
	}

	/**
	 * Test if the content of this frame can be encoded with the specified version
	 * @param version - The version to test
	 * @returns Whether the content can be encoded with the specified version
	 */
	protected contentSupportsVersion(): IVersionSupport{
		return {
			supportsVersion: true,
			reason: ""
		};
	}
}