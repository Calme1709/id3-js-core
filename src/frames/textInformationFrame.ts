import { Buffer } from 'buffer';
import { TextEncodingType, getCorrectIdentifier } from "@utils";
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';
import { IEncodingOptions } from '@encoder/encodingOptions';

/**
 * Text Information Frame
 *
 * The text information frames are often the most important frames, containing information like artist, album and more.
 * All text information frames supports multiple strings, stored as a null separated list, where null is represented by
 * the termination code for the character encoding. All text frame identifiers begin with “T”. Only text frame identifiers
 * begin with “T”.
 *
 * There may only be one text information frame of its kind in an tag.
 */
export default class TextInformationFrame extends Frame {
	/**
	 * The value of this text frame
	 */
	public value: string;

	/**
	 * Decode a text information frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new text information frame
	 * @param identifier - The identifier of this frame
	 * @param value - The value of this text information frame
	 */
	public constructor(identifier: string, value: string);
	public constructor(dataOrIdentifier: string | Buffer, valueOrID3Version: string | number){
		super();

		if(dataOrIdentifier instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrIdentifier, valueOrID3Version as 3 | 4);

			const encoding = new TextEncodingType(dataOrIdentifier[headerInfo.headerSize]);

			this.value = encoding.decodeText(dataOrIdentifier.slice((headerInfo.headerSize) + 1));
		} else {
			this.identifier = dataOrIdentifier;
			this.value = valueOrID3Version as string;
		}
	}

	/**
	 * Encode the content of the frame
	 * @param encodingOptions - The encoding options to encode with
	 * @returns The encoded content
	 */
	public encodeContent(encodingOptions: IEncodingOptions){
		return Buffer.concat([
			Buffer.from(new Uint8Array([
				encodingOptions.textEncoding.byteRepresentation
			])),
			encodingOptions.textEncoding.encodeText(this.value)
		]);
	}

	/**
	 * Test if the content of this frame can be encoded with the specified version
	 * @param version - The version to test
	 * @returns Whether the content can be encoded with the specified version
	 */
	protected contentSupportsVersion(version: number): IVersionSupport{
		const addedInV3 = [ "TRSN", "TRSO" ];
		const addedInV4 = [
			"TDEN",
			"TDOR",
			"TDRC",
			"TDRL",
			"TDTG",
			"TIPL",
			"TMCL",
			"TMOO",
			"TPRO",
			"TSOA",
			"TSOP",
			"TSOT",
			"TSST"
		];

		const removedInV4 = [ "TDAT", "TIME", "TORY", "TRDA", "TSIZ", "TYER" ];

		if(version === 2){
			if(addedInV3.includes(this.identifier)){
				return {
					supportsVersion: false,
					reason: "This frame is only supported in ID3v2.3+"
				};
			}

			if(addedInV4.includes(this.identifier)){
				return {
					supportsVersion: false,
					reason: "This frame is only supported in ID3v2.4"
				};
			}
		}

		if(version === 3){
			if(addedInV4.includes(this.identifier)){
				return {
					supportsVersion: false,
					reason: "This frame is only supported in ID3v2.4"
				};
			}
		}

		if(version === 4){
			if(removedInV4.includes(getCorrectIdentifier(this.identifier, 3))){
				return {
					supportsVersion: false,
					reason: "This frame was removed in ID3v2.4"
				};
			}
		}

		return {
			supportsVersion: true,
			reason: ""
		};
	}
}