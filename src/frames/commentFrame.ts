import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IEncodingOptions } from '@encoder/encodingOptions';
import { IVersionSupport } from '@encoder/isVersionSupported';
import { TextEncodingType } from '@utils';

/**
 * The information that is stored in a comment frame
 */
interface ICommentValue {
	language: string;
	description: string;
	value: string;
}

/**
 * An comment frame
 */
export default class CommentFrame extends Frame {
	/**
	 * The type of frame
	 */
	public frameType = "COMMENTFRAME";

	/**
	 * The identifier of this frame
	 */
	public identifier!: string;

	/**
	 * The value of this frame
	 */
	public value: ICommentValue;

	/**
	 * Decode a comment frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new comment frame
	 * @param value - The value of this unsynchronised lyrics frame
	 */
	public constructor(value: ICommentValue);
	public constructor(dataOrValue: Buffer | ICommentValue, ID3Version?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, ID3Version as 3 | 4);

			const encoding = new TextEncodingType(dataOrValue[headerInfo.headerSize]);

			const language = dataOrValue.slice(headerInfo.headerSize + 1, headerInfo.headerSize + 4).toString("latin1");

			const splitPoint = dataOrValue.indexOf(encoding.terminator, headerInfo.headerSize + 4);

			this.value = {
				language,
				description: encoding.decodeText(dataOrValue.slice(headerInfo.headerSize + 4, splitPoint)),
				value: encoding.decodeText(dataOrValue.slice(splitPoint + encoding.terminator.length))
			};
		} else {
			this.identifier = "COMM";

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
			Buffer.from(this.value.language, "latin1"),
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