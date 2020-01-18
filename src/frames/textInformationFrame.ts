import { Buffer } from 'buffer';
import Utils from '../utils';
import Frame from './frameComponents/frame';
import { IEncodingOptions } from '../encodingOptions';

/**
 * A basic text information frame
 */
export default class TextInformationFrame extends Frame {
	/**
	 * The supported ID3v2 versions
	 */
	protected get contentSupportedVersions(){
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

		if(addedInV4.includes(this.identifier)){
			return [ 4 ];
		}

		if(addedInV3.includes(this.identifier)){
			return [ 3, 4 ];
		}

		if(removedInV4.includes(Utils.getCorrectIdentifier(this.identifier, 3))){
			return [ 2, 3 ];
		}

		return [ 2, 3, 4 ];
	}

	/**
	 * The type of frame
	 */
	public frameType = "TEXTINFORMATIONFRAME";

	/**
	 * The frame identifier
	 */
	public identifier: string;

	/**
	 * The value of this text frame
	 */
	public value: string;

	public constructor(dataBuffer: Buffer, ID3Version: number);
	public constructor(identifier: string, value: string);
	public constructor(dataOrIdentifier: string | Buffer, valueOrID3Version: string | number){
		super();

		if(dataOrIdentifier instanceof Buffer){
			const identifierLength = Utils.getIdentifierLength(valueOrID3Version as number);
			const encoding = Utils.getEncoding(dataOrIdentifier[valueOrID3Version === 2 ? 6 : 10]);

			this.identifier = dataOrIdentifier.slice(0, identifierLength).toString("latin1");

			this.value = dataOrIdentifier.slice((valueOrID3Version === 2 ? 6 : 10) + 1).toString(encoding);
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
	public encodeContent(encodingOptions: IEncodingOptions): Buffer {
		return Buffer.concat([
			Buffer.from(new Uint8Array([
				Utils.getEncodingByte(encodingOptions.textEncoding)
			])),
			Buffer.from(this.value, encodingOptions.textEncoding)
		]);
	}
}