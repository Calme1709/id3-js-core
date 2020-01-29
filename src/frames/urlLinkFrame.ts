import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IEncodingOptions } from '../encodingOptions';

/**
 * A basic URL Link frame
 */
export default class URLLinkFrame extends Frame {
	/**
	 * The type of frame
	 */
	public frameType = "URLLINKFRAME";

	/**
	 * The identifier of this frame
	 */
	public identifier!: string;

	/**
	 * The value of this text frame
	 */
	public value: string;

	/**
	 * The supported ID3v2 versions
	 */
	protected get contentSupportedVersions(){
		const addedInV3 = [ "WORS", "WPAY" ];

		if(addedInV3.includes(this.identifier)){
			return [ 3, 4 ];
		}

		return [ 2, 3, 4 ];
	}

	/**
	 * Decode a URL link frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a URL link information frame
	 * @param identifier - The identifier of this frame
	 * @param value - The value of this text information frame
	 */
	public constructor(identifier: string, value: string);
	public constructor(dataOrIdentifier: string | Buffer, valueOrID3Version: string | number){
		super();

		if(dataOrIdentifier instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrIdentifier, valueOrID3Version as 2 | 3 | 4);

			this.value = dataOrIdentifier.slice(headerInfo.headerSize).toString("latin1");
		} else {
			this.identifier = dataOrIdentifier;
			this.value = valueOrID3Version as string;
		}
	}

	/**
	 * Encode the content of the frame
	 * @param encodingOptions - The encoding options to encode with
	 * @returns The encoded content
	 */
	public encodeContent(encodingOptions: IEncodingOptions){
		return Buffer.from(this.value, encodingOptions.textEncoding);
	}
}