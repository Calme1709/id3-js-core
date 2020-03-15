import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';
import { bufferFromNumbers } from '@utils';

/**
 * The value of a play counter frame
 */
interface IPlayCounterValue {
	/**
	 * The amount of times this file has been played
	 */
	playCount: number;
}

/**
 * Play Counter
 *
 * This is simply a counter of the number of times a file has been played. The value is increased by one every time the file
 * begins to play.
 *
 * There may only be one of this frame in a tag.
 */
export default class PlayCounterFrame extends Frame<IPlayCounterValue> {
	/**
	 * Decode a play counter frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new attached picture frame
	 * @param value - The value of this attached picture frame
	 */
	public constructor(value: IPlayCounterValue);
	public constructor(dataOrValue: Buffer | IPlayCounterValue, ID3Version?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, ID3Version as 2 | 3 | 4);

			const frameContent = dataOrValue.slice(headerInfo.headerSize);

			this.value = {
				playCount: frameContent.readIntBE(0, frameContent.length)
			};
		} else {
			this.identifier = "PCNT";

			this.value = dataOrValue;
		}
	}

	/**
	 * Encode the content of the frame
	 * @param encodingOptions - The encoding options to encode with
	 * @returns The encoded content
	 */
	public encodeContent(){
		return bufferFromNumbers([
			this.value.playCount
		], this.value.playCount < 2 ** 32 - 1 ? 4 : undefined);
	}

	/**
	 * Test if the content of this frame can be encoded with the specified version
	 * @param version - The version to test
	 * @returns Whether the content can be encoded with the specified version
	 */
	protected contentSupportsVersion(): IVersionSupport {
		return {
			supportsVersion: true,
			reason: ""
		};
	}
}