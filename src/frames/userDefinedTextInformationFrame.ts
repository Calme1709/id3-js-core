import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IEncodingOptions } from '@encoder/encodingOptions';
import { IVersionSupport } from '@encoder/isVersionSupported';
import { TextEncodingType } from '@utils';

/**
 * The information that is stored in a User Defined Text Information frame
 */
interface IUserDefinedTextInformationValue {
	/**
	 * A short description of the content in this frame
	 */
	description: string;

	/**
	 * The content that is stored in this frame
	 */
	value: string;
}

/**
 * User Defined Text Information
 *
 * This frame is intended for one-string text information concerning the audio file in that does not fit into any of the
 * other predefined text information frames.
 *
 * There may be more than one of this frame in a tag, but only one with the same description.
 */
export default class UserDefinedTextInformationFrame extends Frame<IUserDefinedTextInformationValue> {
	/**
	 * Decode a User Defined Text Information frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new User Defined Text Information frame
	 * @param value - The content of this User Defined Text Information frame
	 */
	public constructor(value: IUserDefinedTextInformationValue);
	public constructor(dataOrValue: IUserDefinedTextInformationValue | Buffer, ID3VersionOrValue?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, ID3VersionOrValue as 3 | 4);

			const encoding = new TextEncodingType(dataOrValue[headerInfo.headerSize]);

			const splitPoint = dataOrValue.indexOf(encoding.terminator, headerInfo.headerSize + 1);

			this.value = {
				description: encoding.decodeText(dataOrValue.slice(headerInfo.headerSize + 1, splitPoint)),
				value: encoding.decodeText(dataOrValue.slice(splitPoint + encoding.terminator.length))
			};
		} else {
			this.identifier = "TXXX";

			this.value = dataOrValue;
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