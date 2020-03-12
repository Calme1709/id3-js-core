import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';
import { TimestampUnit, TextEncodingType } from '@utils';
import { IEncodingOptions } from '@encoder/encodingOptions';

/**
 * A lyric and time code entry
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
 * The data that is stored in a Synchronised Lyrics frame
 */
interface ISynchronisedLyricsValue {
	/**
	 * The language that the information in this frame is written in
	 */
	language: string;

	/**
	 * The type of content that this frame contains, this is stored as a number which represents one of the content types below;
	 *
	 * 0 - Other
	 *
	 * 1 - Lyrics
	 *
	 * 2 - Text transcription
	 *
	 * 3 - Movement/part name (e.g. "Adagio")
	 *
	 * 4 - Events (e.g. "Don Quijote enters the stage")
	 *
	 * 5 - Chord (e.g. "Bb F Fsus")
	 *
	 * 6 - Trivia/'pop up' information
	 *
	 * 7 - URLs to webpages
	 *
	 * 8 - URLs to images
	 */
	contentType: number;

	/**
	 * A short description of the content that is scored in this frame
	 */
	description: string;

	/**
	 * The unit that all of the times are stored in for the lyrics
	 */
	timestampUnit: TimestampUnit;

	/**
	 * The lyrics and their timing codes that are stored in this frame
	 */
	lyrics: ILyric[];
}

/**
 * Synchronised Lyrics
 *
 * This frame provides a method of incorporating the words, said or sung lyrics, in the audio file as text in sync with the
 * audio. It might also be used to describing events e.g. occurring on a stage or on the screen in sync with the audio.
 *
 * There may be more than one of this frame in a tag, however only one with the same language and content descriptor.
 */
export default class SynchronisedLyricsFrame extends Frame<ISynchronisedLyricsValue> {
	/**
	 * Decode a Synchronised Lyrics frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new Synchronised Lyrics frame
	 * @param value - The value of this Synchronised Lyrics frame
	 */
	public constructor(value: ISynchronisedLyricsValue);
	public constructor(dataOrValue: Buffer | ISynchronisedLyricsValue, ID3Version?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, ID3Version as 3 | 4);
			const frameContent = dataOrValue.slice(headerInfo.headerSize);

			const encoding = new TextEncodingType(frameContent[0]);
			const endOfDescriptor = frameContent.indexOf(encoding.terminator, 6);

			this.value = {
				language: frameContent.slice(1, 4).toString("latin1"),
				timestampUnit: new TimestampUnit(frameContent[4]),
				contentType: frameContent[5],
				description: encoding.decodeText(frameContent.slice(6, endOfDescriptor)),
				lyrics: []
			};

			let index = endOfDescriptor + encoding.terminator.length;
			while(index < dataOrValue.length){
				const indexOfSeparator = dataOrValue.indexOf(encoding.terminator, index);

				this.value.lyrics.push({
					time: dataOrValue.readInt32BE(indexOfSeparator + encoding.terminator.length),
					text: encoding.decodeText(dataOrValue.slice(index, indexOfSeparator))
				});

				index = indexOfSeparator + encoding.terminator.length + 4;
			}
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