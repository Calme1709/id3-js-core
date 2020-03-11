import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';

/**
 * The information stored in a UFID frame
 */
interface IUFIDValue {
	/**
	 * This is a null-terminated string with a URL containing an email address, or a link to a location where an email address
	 * can be found, that belongs to the organisation responsible for this specific database implementation.
	 */
	ownerIdentifier: string;

	/**
	 * This is the unique identifier that is used to identify this file in a database.
	 */
	identifier: Buffer;
}

/**
 * UFID
 *
 * The purpose of this frame is to be able to identify the audio file in a database, that may provide more information
 * relevant to the content.
 *
 * There may be more than one of this frame in a tag, but only one with the same owner identifier.
 */
export default class UFIDFrame extends Frame<IUFIDValue> {
	/**
	 * Decode a UFID frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new UFID frame
	 * @param value - The value of this UFID frame
	 */
	public constructor(value: IUFIDValue);
	public constructor(dataOrValue: IUFIDValue | Buffer, identifierOrID3Version?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, identifierOrID3Version as 3 | 4);

			const splitPoint = dataOrValue.indexOf(0x00, headerInfo.headerSize);

			this.value = {
				ownerIdentifier: dataOrValue.slice(headerInfo.headerSize, splitPoint).toString("latin1"),
				identifier: dataOrValue.slice(splitPoint + 1)
			};
		} else {
			this.identifier = "UFID";

			this.value = dataOrValue;
		}
	}

	/**
	 * Encode the content of the frame
	 * @param encodingOptions - The encoding options to encode with
	 * @returns The encoded content
	 */
	public encodeContent(){
		const contentBuffer = Buffer.alloc(this.identifier.length + 1, 0);
		contentBuffer.write(this.value.ownerIdentifier, 0, this.value.ownerIdentifier.length, "latin1");

		return Buffer.concat([
			contentBuffer,
			this.value.identifier
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