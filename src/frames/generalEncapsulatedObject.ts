import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';
import { IEncodingOptions } from '@encoder/encodingOptions';
import { bufferFromNumbers, TextEncodingType } from '@utils';

/**
 * The value of a general encapsulated object frame
 */
interface IGeneralEncapsulatedObjectValue {
	/**
	 * This is the mime type of the object that is stored in this frame, the standard mime type format of "type/xyz"
	 */
	mimeType: string;

	/**
	 * A short description of the object that is stored in this frame
	 */
	description: string;

	/**
	 * The filename of the encapsulated object, this is case sensitive
	 */
	filename: string;

	/**
	 * The raw binary data of the file
	 */
	objectData: Buffer;
}

/**
 * General Encapsulated Object
 *
 * This frame is used to store any type of file.
 *
 * There may be more than one of this frame in a tag, but only one with the same content descriptor.
 */
export default class GeneralEncapsulatedObjectFrame extends Frame<IGeneralEncapsulatedObjectValue> {
	/**
	 * Decode a general encapsulated object frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new general encapsulated object frame
	 * @param value - The value of this general encapsulated object frame
	 */
	public constructor(value: IGeneralEncapsulatedObjectValue);
	public constructor(dataOrValue: Buffer | IGeneralEncapsulatedObjectValue, ID3Version?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, ID3Version as 2 | 3 | 4);

			const frameContent = dataOrValue.slice(headerInfo.headerSize);

			const textEncoding = new TextEncodingType(frameContent[0]);

			const terminatorLen = textEncoding.terminator.length;

			const endOfMime = frameContent.indexOf(0x00, 1);
			const endOfFilename = frameContent.indexOf(textEncoding.terminator, endOfMime + 1);
			const endOfDescription = frameContent.indexOf(textEncoding.terminator, endOfFilename + terminatorLen);

			this.value = {
				mimeType: frameContent.slice(1, endOfMime).toString("latin1"),
				filename: textEncoding.decodeText(frameContent.slice(endOfMime + 1, endOfFilename)),
				description: textEncoding.decodeText(frameContent.slice(endOfFilename + terminatorLen, endOfDescription)),
				objectData: frameContent.slice(endOfDescription + terminatorLen)
			};
		} else {
			this.identifier = "GEOB";

			this.value = dataOrValue;
		}
	}

	/**
	 * Encode the content of the frame
	 * @param encodingOptions - The encoding options to encode with
	 * @returns The encoded content
	 */
	public encodeContent(encodingOptions: IEncodingOptions){
		const latin1Encoding = new TextEncodingType("ISO-8859-1");

		console.log(encodingOptions.textEncoding);

		return Buffer.concat([
			bufferFromNumbers([ encodingOptions.textEncoding.byteRepresentation ], 1),	//Text encoding type
			latin1Encoding.encodeText(this.value.mimeType),
			latin1Encoding.terminator,
			encodingOptions.textEncoding.encodeText(this.value.filename),
			encodingOptions.textEncoding.terminator,
			encodingOptions.textEncoding.encodeText(this.value.description),
			encodingOptions.textEncoding.terminator,
			this.value.objectData
		]);
	}

	/**
	 * Test if the content of this frame can be encoded with the specified version
	 * @param version - The version to test
	 * @returns Whether the content can be encoded with the specified version
	 */
	protected contentSupportsVersion(): IVersionSupport {
		return {
			supportsVersion: true,
			reason: ""
		};
	}
}