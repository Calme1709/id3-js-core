import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';
import { TimestampUnit, TextEncodingType } from '@utils';
import { IEncodingOptions } from '@encoder/encodingOptions';

/**
 * A singular tempo code
 */
interface ILyric {
	/**
	 * The time that this tempo code relates to
	 */
	time: number;

	/**
	 * The text that is related to the specified time
	 */
	text: string;
}

/**
 * The differnet types of content that can be in a synchronised lyrics frame
 */
enum SynchronisedLyricsContentType {
	/**
	 * Other
	 */
	other = 0,

	/**
	 * Lyrics
	 */
	lyrics = 1,

	/**
	 * Text transcription
	 */
	textTranscription = 2,

	/**
	 * Movement/part name (e.g. "Adagio")
	 */
	partNames = 3,

	/**
	 * Events (e.g. "Don Quijote enters the stage")
	 */
	events = 4,

	/**
	 * Chord (e.g. "Bb F Fsus")
	 */
	chord = 5,

	/**
	 * Trivia/'pop up' information
	 */
	trivia = 6,

	/**
	 * URLs to webpages
	 */
	webpageUrls = 7,

	/**
	 * URLs to images
	 */
	imageUrls = 8
}

/**
 * The data that is stored in an synchronised tempo codes frame
 */
interface ISynchronisedLyricsValue {
	/**
	 * The language that this frame is in
	 */
	language: string;

	/**
	 * The type of content that this frame contains
	 */
	contentType: SynchronisedLyricsContentType;

	/**
	 * The description of this frame
	 */
	description: string;

	/**
	 * The unit that all of the times are stored in for the lyrics
	 */
	timestampUnit: TimestampUnit;

	/**
	 * The lyrics
	 */
	lyrics: ILyric[];
}

/**
 * A basic text information frame
 */
export default class SynchronisedLyricsFrame extends Frame {
	/**
	 * The frame identifier
	 */
	public identifier!: string;

	/**
	 * The value of this frame
	 */
	public value: ISynchronisedLyricsValue;

	/**
	 * Decode a synchronised lyrics frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new synchronised lyrics frame
	 * @param value - The value of this synchronised lyrics frame
	 */
	public constructor(value: ISynchronisedLyricsValue);
	public constructor(dataOrValue: Buffer | ISynchronisedLyricsValue, ID3Version?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, ID3Version as 3 | 4);

			const encoding = new TextEncodingType(dataOrValue[headerInfo.headerSize]);
			const endOfDescriptor = dataOrValue.indexOf(encoding.terminator, headerInfo.headerSize + 6);

			const lyrics: ILyric[] = [];

			let index = endOfDescriptor + encoding.terminator.length;

			while(index < dataOrValue.length){
				const indexOfSeperator = dataOrValue.indexOf(encoding.terminator, index);

				lyrics.push({
					time: dataOrValue.readInt32BE(indexOfSeperator + encoding.terminator.length),
					text: encoding.decodeText(dataOrValue.slice(index, indexOfSeperator))
				});

				index = indexOfSeperator + encoding.terminator.length + 4;
			}

			this.value = {
				language: dataOrValue.slice(headerInfo.headerSize + 1, headerInfo.headerSize + 4).toString("latin1"),
				timestampUnit: new TimestampUnit(dataOrValue[headerInfo.headerSize + 4]),
				contentType: dataOrValue[headerInfo.headerSize + 5],
				description: encoding.decodeText(dataOrValue.slice(headerInfo.headerSize + 6, endOfDescriptor)),
				lyrics
			};
		} else {
			this.identifier = "SYLT";

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
			Buffer.from(new Uint8Array([
				encodingOptions.textEncoding.byteRepresentation
			])),
			Buffer.from(this.value.language, "latin1"),
			Buffer.from(new Uint8Array([
				this.value.timestampUnit.byteRepresentation,
				this.value.contentType
			])),
			encodingOptions.textEncoding.encodeText(this.value.description),
			encodingOptions.textEncoding.terminator,
			...this.value.lyrics.map(lyric => {
				const timeBuffer = Buffer.alloc(4, 0);
				timeBuffer.writeInt32BE(lyric.time, 0);

				return Buffer.concat([
					encodingOptions.textEncoding.encodeText(lyric.text),
					encodingOptions.textEncoding.terminator,
					timeBuffer
				]);
			})
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