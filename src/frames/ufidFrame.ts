import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';

/**
 * The information stored in a UFID frame
 */
interface IUFIDValue {
	ownerIdentifier: string;
	identifier: Buffer;
}

/**
 * A UFID frame
 */
export default class UFIDFrame extends Frame {
	/**
	 * The identifier of this frame
	 */
	public identifier!: string;

	/**
	 * The value of this text frame
	 */
	public value: IUFIDValue;

	/**
	 * Decode a UFID frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new UFID frame
	 * @param ownerIdentifier - The owner identifier that is to be stored in this frame, typically this is an email or a link
	 * to a webpage where an email can be found
	 * @param identifier - The unique file identifier, this is a buffer which can be up to 64 bits
	 */
	public constructor(ownerIdentifier: string, identifier: Buffer);
	public constructor(dataOrOwnerIdentifier: string | Buffer, identifierOrID3Version: Buffer | number){
		super();

		if(dataOrOwnerIdentifier instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrOwnerIdentifier, identifierOrID3Version as 3 | 4);

			const splitPoint = dataOrOwnerIdentifier.indexOf(0x00, headerInfo.headerSize);

			this.value = {
				ownerIdentifier: dataOrOwnerIdentifier.slice(headerInfo.headerSize, splitPoint).toString("latin1"),
				identifier: dataOrOwnerIdentifier.slice(splitPoint + 1)
			};
		} else {
			if(dataOrOwnerIdentifier.length === 0){
				throw new Error("Owner identifier of a UFID frame cannot be empty");
			}

			if((identifierOrID3Version as Buffer).length > 64){
				throw new Error("Identifier of a UFID frame can be at most 64 bytes in length");
			}

			this.identifier = "UFID";

			this.value = {
				identifier: identifierOrID3Version as Buffer,
				ownerIdentifier: dataOrOwnerIdentifier
			};
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