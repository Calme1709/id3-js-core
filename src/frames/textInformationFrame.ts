import { Buffer } from 'buffer';
import Utils from '../utils';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '../encoder/getSupportedTagVersions';
import { IEncodingOptions } from '../encoder/encodingOptions';

/**
 * A basic text information frame
 */
export default class TextInformationFrame extends Frame {
	/**
	 * The type of frame
	 */
	public frameType = "TEXTINFORMATIONFRAME";

	/**
	 * The frame identifier
	 */
	public identifier!: string;

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

			const encoding = Utils.getEncoding(dataOrIdentifier[headerInfo.headerSize]);

			this.value = dataOrIdentifier.slice((headerInfo.headerSize) + 1).toString(encoding);
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
				Utils.getEncodingByte(encodingOptions.textEncoding)
			])),
			Buffer.from(this.value, encodingOptions.textEncoding)
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
			if(removedInV4.includes(Utils.getCorrectIdentifier(this.identifier, 3))){
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