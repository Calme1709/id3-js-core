import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';

/**
 * The value that is stored in a Music CD Identifier frame
 */
interface IMusicCDIdentifierValue {
	/**
	 * The identifier of this CD
	 */
	identifier: Buffer;
}

/**
 * Music CD Identifier
 *
 * This frame is intended for music that comes from a CD, so that the CD can be identified in databases such as the CDDB. The
 * frame consists of a binary dump of the Table Of Contents, TOC, from the CD, which is a header of 4 bytes and then 8 bytes/
 * track on the CD plus 8 bytes for the ‘lead out’, making a maximum of 804 bytes. The offset to the beginning of every track
 * on the CD should be described with a four bytes absolute CD-frame address per track, and not with absolute time. When this
 * frame is used the presence of a valid “TRCK” frame is REQUIRED, even if the CD’s only got one track. It is recommended
 * that this frame is always added to tags originating from CDs.
 *
 * There can only be one of this frame in a tag.
 */
export default class MusicCDIdentifierFrame extends Frame {
	/**
	 * The value of this frame
	 */
	public value: IMusicCDIdentifierValue;

	/**
	 * Decode a Music CD Identifier frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new Music CD Identifier frame
	 * @param value - The value of this Music CD Identifier frame
	 */
	public constructor(value: IMusicCDIdentifierValue);
	public constructor(dataOrValue: Buffer | IMusicCDIdentifierValue, ID3Version?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, ID3Version as 2 | 3 | 4);

			this.value = {
				identifier: dataOrValue.slice(headerInfo.headerSize)
			};
		} else {
			this.identifier = "MCDI";

			this.value = dataOrValue;
		}
	}

	/**
	 * Encode the content of the frame
	 * @param encodingOptions - The encoding options to encode with
	 * @returns The encoded content
	 */
	public encodeContent(){
		return this.value.identifier;
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