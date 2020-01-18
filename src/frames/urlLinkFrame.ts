import { Buffer } from 'buffer';
import Utils from '../utils';
import Frame from './frameComponents/frame';
import { IEncodingOptions } from '../encodingOptions';

/**
 * A basic URL Link frame
 */
export default class URLLinkFrame extends Frame {
	/**
	 * The supported ID3v2 versions
	 */
	get contentSupportedVersions(){
		const addedInV3 = [ "WORS", "WPAY" ];

		if(addedInV3.includes(this.identifier)){
			return [ 3, 4 ];
		}

		return [ 2, 3, 4 ];
	}

	/**
	 * The type of frame
	 */
	public frameType = "URLLINKFRAME";

	public identifier: string;

	/**
	 * The value of this text frame
	 */
	public value: string;

	public constructor(dataBuffer: Buffer, ID3Version: number);
	public constructor(identifier: string, value: string);
	public constructor(dataOrIdentifier: string | Buffer, valueOrID3Version: string | number){
		super();

		if(dataOrIdentifier instanceof Buffer){
			const identifierLength = Utils.getIdentifierLength(valueOrID3Version as number);

			this.identifier = dataOrIdentifier.slice(0, identifierLength).toString("latin1");
			this.value = dataOrIdentifier.slice(valueOrID3Version === 2 ? 6 : 10).toString("latin1");
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
	public encodeContent(encodingOptions: IEncodingOptions): Buffer {
		return Buffer.from(this.value, encodingOptions.textEncoding);
	}
}