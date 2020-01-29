import { Buffer } from 'buffer';
import Utils from '../utils';
import Frame from './frameComponents/frame';
import { IEncodingOptions } from '../encodingOptions';

/**
 * The information that is stored in a user defined text information frame
 */
interface IUserDefinedTextInformationValue {
	description: string;
	value: string;
}

/**
 * A user defined text information frame
 */
export default class UserDefinedTextInformationFrame extends Frame {
	/**
	 * The type of frame
	 */
	public frameType = "USERDEFINEDTEXTINFORMATIONFRAME";

	/**
	 * The identifier of this frame
	 */
	public identifier!: string;

	/**
	 * The value of this text frame
	 */
	public value: IUserDefinedTextInformationValue;

	/**
	 * The supported ID3v2 versions
	 */
	protected readonly contentSupportedVersions = [ 2, 3, 4 ];

	/**
	 * Decode a user defined text information frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new user defined text information frame
	 * @param description - The description of the content that this frame contains, this should be unique
	 * @param value - The content of this frame
	 */
	public constructor(description: string, value: string);
	public constructor(dataOrDescription: string | Buffer, ID3VersionOrValue: number | string){
		super();

		if(dataOrDescription instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrDescription, ID3VersionOrValue as 3 | 4);

			const encodingType = Utils.getEncoding(dataOrDescription[headerInfo.headerSize]);

			const nullByteLength = Utils.getNullByteLength(dataOrDescription[headerInfo.headerSize]);

			const splitPoint = nullByteLength === 2 ?
				Utils.indexOfDoubleZeroByte(dataOrDescription, headerInfo.headerSize) :
				dataOrDescription.indexOf(0x00, headerInfo.headerSize);

			this.value = {
				description: dataOrDescription.slice(headerInfo.headerSize, splitPoint).toString(encodingType),
				value: dataOrDescription.slice(splitPoint + nullByteLength).toString(encodingType)
			};
		} else {
			this.value = {
				description: dataOrDescription,
				value: ID3VersionOrValue as string
			};
		}
	}

	/**
	 * Encode the content of the frame
	 * @param encodingOptions - The encoding options to encode with
	 * @returns The encoded content
	 */
	public encodeContent(encodingOptions: IEncodingOptions){
		return Buffer.concat([
			Buffer.from(new Uint8Array([ Utils.getEncodingByte(encodingOptions.textEncoding) ])),
			Buffer.from(this.value.description, encodingOptions.textEncoding),
			Buffer.from(new Uint8Array(Utils.getNullByteLength(encodingOptions.textEncoding) === 2 ? [ 0, 0 ] : [ 0 ])),
			Buffer.from(this.value.value, encodingOptions.textEncoding)
		]);
	}
}