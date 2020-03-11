import { Buffer } from 'buffer';
import CommentFrame from './commentFrame';

/**
 * The information that is stored in a Unsynchronised Lyrics frame
 */
interface IUnsynchronisedLyricsValue {
	/**
	 * The language that the content of this frame is written in.
	 */
	language: string;

	/**
	 * A short description of the content that this frame stores
	 */
	description: string;

	/**
	 * The content of this frame, e.g. lyrics of the song or a text transcription of other vocal activities.
	 * Newline characters are allowed in the text.
	 */
	value: string;
}

/**
 * Unsynchronised Lyrics
 *
 * This frame contains the lyrics of the song or a text transcription of other vocal activities.
 *
 * There may be more than one of this frame in each tag, but only one with the same language and content descriptor.
 */
export default class UnsynchronisedLyricsFrame extends CommentFrame {
	/**
	 * Decode an Unsynchronised Lyrics Frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new Unsynchronised Lyrics frame
	 * @param value - The value of this Unsynchronised Lyrics frame
	 */
	public constructor(value: IUnsynchronisedLyricsValue);
	public constructor(...args: [ Buffer, number ] | [ IUnsynchronisedLyricsValue ]){
		super(...args as [ Buffer, number ]);

		if(!(args[0] instanceof Buffer)){
			this.identifier = "USLT";
		}
	}
}