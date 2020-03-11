import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IEncodingOptions } from '@encoder/encodingOptions';
import { IVersionSupport } from '@encoder/isVersionSupported';
import { TextEncodingType } from '@utils';

/**
 * The information that is stored in a User Defined URL Link frame
 */
interface IUserDefinedURLLinkValue {
	/**
	 * A short description of the link that is stored in this frame
	 */
	description: string;

	/**
	 * A URL, this could be to any number of online resources
	 */
	value: string;
}

/**
 * User Defined URL Link
 *
 * This frame is intended for URL Links concerning the audio file in that do not fit into any of the
 * other predefined URL Link frames.
 *
 * There may be more than one of this frame in a tag, but only one with the same description.
 */
export default class UserDefinedURLLinkFrame extends Frame {
	/**
	 * The value of this frame
	 */
	public value: IUserDefinedURLLinkValue;

	/**
	 * Decode a User Defined URL Link frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new User Defined URL Link frame
	 * @param value - The value of this User Defined URL Link frame
	 */
	public constructor(value: IUserDefinedURLLinkValue);
	public constructor(dataOrValue: IUserDefinedURLLinkValue | Buffer, ID3VersionOrValue?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, ID3VersionOrValue as 3 | 4);

			const encoding = new TextEncodingType(dataOrValue[headerInfo.headerSize]);

			const splitPoint = dataOrValue.indexOf(encoding.terminator, headerInfo.headerSize + 1);

			this.value = {
				description: encoding.decodeText(dataOrValue.slice(headerInfo.headerSize + 1, splitPoint)),
				value: dataOrValue.slice(splitPoint + encoding.terminator.length).toString()
			};
		} else {
			this.identifier = "WXXX";

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