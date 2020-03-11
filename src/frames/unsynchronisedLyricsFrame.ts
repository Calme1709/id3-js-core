import { Buffer } from 'buffer';
import CommentFrame from './commentFrame';

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
export default class UnsynchronisedLyricsFrame extends CommentFrame {
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
	public constructor(...args: [ Buffer, number ] | [ IUnsynchronisedLyricsValue ]){
		super(...args as [ Buffer, number ]);

		if(!(args[0] instanceof Buffer)){
			this.identifier = "USLT";
		}
	}
}