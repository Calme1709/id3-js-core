import { Buffer } from 'buffer';
import Utils from '../utils';
import Frame from './frameComponents/frame';
import { IEncodingOptions } from '../encoder/encodingOptions';
import { IVersionSupport } from '../encoder/getSupportedTagVersions';

/**
 * The information that is stored in a unsynchronised lyrics frame
 */
interface IUnsynchronisedLyricsValue {
	language: string;
	description: string;
	value: string;
}

/**
 * An unsynchronised lyrics frame
 */
export default class UnsynchronisedLyricsFrame extends Frame {
	/**
	 * The type of frame
	 */
	public frameType = "UNSYNCHRONISEDLYRICSFRAME";

	/**
	 * The identifier of this frame
	 */
	public identifier!: string;

	/**
	 * The value of this text frame
	 */
	public value: IUnsynchronisedLyricsValue;

	/**
	 * Decode an unsynchronised lyrics frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new unsynchronised lyrics frame
	 * @param value - The value of this unsynchronised lyrics frame
	 */
	public constructor(value: IUnsynchronisedLyricsValue);
	public constructor(dataOrValue: Buffer | IUnsynchronisedLyricsValue, ID3Version?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, ID3Version as 3 | 4);

			const encodingType = Utils.getEncoding(dataOrValue[headerInfo.headerSize]);
			const language = dataOrValue.slice(headerInfo.headerSize + 1, headerInfo.headerSize + 4).toString("latin1");

			const delimiter = Utils.getTerminator(encodingType);

			const splitPoint = dataOrValue.indexOf(delimiter, headerInfo.headerSize + 4);

			this.value = {
				language,
				description: dataOrValue.slice(headerInfo.headerSize + 4, splitPoint).toString(encodingType),
				value: dataOrValue.slice(splitPoint + delimiter.length).toString(encodingType)
			};
		} else {
			this.identifier = "USLT";

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
			Buffer.from(new Uint8Array([ Utils.getEncodingByte(encodingOptions.textEncoding) ])),
			Buffer.from(this.value.language.substr(0, 3), "latin1"),
			Buffer.from(this.value.description, encodingOptions.textEncoding),
			Utils.getTerminator(encodingOptions.textEncoding),
			Buffer.from(this.value.value, encodingOptions.textEncoding)
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