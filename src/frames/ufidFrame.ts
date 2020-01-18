import { Buffer } from 'buffer';
import Utils from '../utils';
import Frame from './frameComponents/frame';
import { IEncodingOptions } from '../encodingOptions';

/**
 * The information stored in a UFID frame
 */
interface IUFIDValue {
	ownerIdentifier: string;
	identifier: Buffer;
}

/**
 * A basic URL Link frame
 */
export default class URLLinkFrame extends Frame {
	/**
	 * The supported ID3v2 versions
	 */
	public readonly contentSupportedVersions = [ 2, 3, 4 ];

	/**
	 * The type of frame
	 */
	public frameType = "UFIDFRAME";

	/**
	 * The identifier of this frame
	 */
	public identifier: string;

	/**
	 * The value of this text frame
	 */
	public value: IUFIDValue;

	public constructor(dataBuffer: Buffer, ID3Version: number);
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
}