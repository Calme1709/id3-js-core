import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IEncodingOptions } from '@encoder/encodingOptions';
import { IVersionSupport } from '@encoder/isVersionSupported';
import { TextEncodingType } from '@utils';

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
	 * The identifier of this frame
	 */
	public identifier!: string;

	/**
	 * The value of this text frame
	 */
	public value: IUserDefinedTextInformationValue;

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

			const encoding = new TextEncodingType(dataOrDescription[headerInfo.headerSize]);

			const splitPoint = dataOrDescription.indexOf(encoding.terminator, headerInfo.headerSize + 1);

			this.value = {
				description: encoding.decodeText(dataOrDescription.slice(headerInfo.headerSize + 1, splitPoint)),
				value: encoding.decodeText(dataOrDescription.slice(splitPoint + encoding.terminator.length))
			};
		} else {
			this.identifier = "TXXX";

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
			Buffer.from(new Uint8Array([ encodingOptions.textEncoding.byteRepresentation ])),
			encodingOptions.textEncoding.encodeText(this.value.description),
			encodingOptions.textEncoding.terminator,
			encodingOptions.textEncoding.encodeText(this.value.value)
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