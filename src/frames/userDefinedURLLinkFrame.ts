import { Buffer } from 'buffer';
import Utils from '../utils';
import Frame from './frameComponents/frame';
import { IEncodingOptions } from '../encoder/encodingOptions';
import { IVersionSupport } from '../encoder/getSupportedTagVersions';

/**
 * The information that is stored in a user defined text information frame
 */
interface IUserDefinedURLLinkValue {
	description: string;
	value: string;
}

/**
 * A user defined url link frame
 */
export default class UserDefinedURLLinkFrame extends Frame {
	/**
	 * The type of frame
	 */
	public frameType = "USERDEFINEDURLLINKFRAME";

	/**
	 * The identifier of this frame
	 */
	public identifier!: string;

	/**
	 * The value of this text frame
	 */
	public value: IUserDefinedURLLinkValue;

	/**
	 * Decode a user defined url link frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new user defined url link frame
	 * @param description - The description of the content that this frame contains, this should be unique
	 * @param value - The content of this frame
	 */
	public constructor(description: string, value: string);
	public constructor(dataOrDescription: string | Buffer, ID3VersionOrValue: number | string){
		super();

		if(dataOrDescription instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrDescription, ID3VersionOrValue as 3 | 4);

			const encodingType = Utils.getEncoding(dataOrDescription[headerInfo.headerSize]);

			const delimiter = Utils.getTerminator(encodingType);

			const splitPoint = dataOrDescription.indexOf(delimiter, headerInfo.headerSize + 1);

			this.value = {
				description: dataOrDescription.slice(headerInfo.headerSize + 1, splitPoint).toString(encodingType),
				value: dataOrDescription.slice(splitPoint + delimiter.length).toString()
			};
		} else {
			this.identifier = "WXXX";

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
			Utils.getTerminator(encodingOptions.textEncoding),
			Buffer.from(this.value.value, "latin1")
		]);
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