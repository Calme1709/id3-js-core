import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';
import TextEncodingType from '../utils/textEncodingType';
import { IEncodingOptions } from '@encoder/encodingOptions';
import { bufferFromNumbers } from '@utils';

/**
 * The value of an attached picture frame
 */
interface IAttachedPictureValue {
	/**
	 * This is the mime type of the picture data that is stored in this frame, the standard mime type format of "image/xyz"
	 * should be used. With ID3v2.2 only "image/jpg" and "image/png" are supported.
	 */
	mimeType: string;

	/**
	 * A short description of the picture that is stored in this frame
	 */
	pictureDescription: string;

	/**
	 * The type of picture that this is;
	 *
	 * 0x00: Other
	 *
	 * 0x01: 32x32 pixels 'file icon' (PNG only)
	 *
	 * 0x02: Other file icon
	 *
	 * 0x03: Cover (front)
	 *
	 * 0x04: Cover (back)
	 *
	 * 0x05: Leaflet page
	 *
	 * 0x06: Media (e.g. label side of CD)
	 *
	 * 0x07: Lead artist/lead performer/soloist
	 *
	 * 0x08: Artist/performer
	 *
	 * 0x09: Conductor
	 *
	 * 0x0A: Band/Orchestra
	 *
	 * 0x0B: Composer
	 *
	 * 0x0C: Lyricist/text writer
	 *
	 * 0x0D: Recording Location
	 *
	 * 0x0E: During recording
	 *
	 * 0x0F: During performance
	 *
	 * 0x10: Movie/video screen capture
	 *
	 * 0x11: A bright coloured fish
	 *
	 * 0x12: Illustration
	 *
	 * 0x13: Band/artist logotype
	 *
	 * 0x14: Publisher/Studio logotype
	 */
	pictureType: number;

	/**
	 * The raw binary data of the image
	 */
	pictureData: Buffer;
}

/**
 * Attached Picture
 *
 * This frame contains a picture directly related to the audio file.
 *
 * There may be more than one of this frame in a tag, but only one with the same content descriptor. There may only be one
 * picture with the picture type declared as picture type $01 and $02 respectively.
 */
export default class AttachedPictureFrame extends Frame<IAttachedPictureValue> {
	/**
	 * Decode an attached picture frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new attached picture frame
	 * @param value - The value of this attached picture frame
	 */
	public constructor(value: IAttachedPictureValue);
	public constructor(dataOrValue: Buffer | IAttachedPictureValue, ID3Version?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, ID3Version as 2 | 3 | 4);

			const frameContent = dataOrValue.slice(headerInfo.headerSize);

			const textEncoding = new TextEncodingType(frameContent[0]);

			const endOfMime = ID3Version === 2 ? 4 : frameContent.indexOf(0x00);
			const mimeTerminatorLength = ID3Version === 2 ? 0 : 1;

			const indexOfDescriptionTerminator = frameContent.indexOf(textEncoding.terminator, endOfMime + mimeTerminatorLength + 1);

			this.value = {
				mimeType: `${ID3Version === 2 ? "image/" : ""}${frameContent.slice(1, endOfMime)}`,
				pictureType: frameContent[endOfMime + mimeTerminatorLength],
				pictureDescription: frameContent.slice(endOfMime + mimeTerminatorLength + 1, indexOfDescriptionTerminator).toString("latin1"),
				pictureData: frameContent.slice(indexOfDescriptionTerminator + textEncoding.terminator.length)
			};
		} else {
			this.identifier = "APIC";

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
			bufferFromNumbers([ encodingOptions.textEncoding.byteRepresentation ], 1),	//Text encoding type
			Buffer.from(encodingOptions.ID3Version === 2 ?								//Mime Type
				this.value.mimeType.substring(this.value.mimeType.length - 3) :
				this.value.mimeType
			, "latin1"),
			bufferFromNumbers(encodingOptions.ID3Version === 2 ?						//Possible mime type terminator and picture type
				[ this.value.pictureType ] :
				[ 0x00, this.value.pictureType ]
			, 1),
			encodingOptions.textEncoding.encodeText(this.value.pictureDescription),		//Picture description
			encodingOptions.textEncoding.terminator,									//Picture description terminator
			this.value.pictureData														//Picture data
		]);
	}

	/**
	 * Test if the content of this frame can be encoded with the specified version
	 * @param version - The version to test
	 * @returns Whether the content can be encoded with the specified version
	 */
	protected contentSupportsVersion(version: number): IVersionSupport {
		const v2SupportedMimeTypes = [ "image/jpg", "image/png" ];

		if(version === 2 && !v2SupportedMimeTypes.includes(this.value.mimeType.toLowerCase())){
			return {
				supportsVersion: false,
				reason: "Attached picture frames only support mime types 'image/jpg' and 'image/png' in ID3v2.2"
			};
		}

		return {
			supportsVersion: true,
			reason: ""
		};
	}
}