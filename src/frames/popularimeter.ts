import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';
import { bufferFromNumbers } from '@utils';

/**
 * The value of a popularimeter frame
 */
interface IPopularimeterValue {
	/**
	 * This is the email address of the user that this frame relates to.
	 */
	email: string;

	/**
	 * The rating of the audio file, this is on a scale of 1-255 where 0 is unknown
	 */
	rating: number;

	/**
	 * The amount of times this file has been played.
	 */
	playCount: number;
}

/**
 * Popularimeter
 *
 * The purpose of this frame is to specify how good an audio file is. Many interesting applications could be found to this
 * frame such as a playlist that features better audio files more often than others or it could be used to profile a person’s
 * taste and find other ‘good’ files by comparing people’s profiles.
 *
 * There may be more than one of this frame in each tag, but only one with the same email address.
 */
export default class PopularimeterFrame extends Frame<IPopularimeterValue> {
	/**
	 * Decode a popularimeter frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new popularimeter frame
	 * @param value - The value of this popularimeter frame
	 */
	public constructor(value: IPopularimeterValue);
	public constructor(dataOrValue: Buffer | IPopularimeterValue, ID3Version?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, ID3Version as 2 | 3 | 4);

			const frameContent = dataOrValue.slice(headerInfo.headerSize);

			const emailTerminator = dataOrValue.indexOf(0x00);

			this.value = {
				email: frameContent.slice(0, emailTerminator).toString("latin1"),
				rating: frameContent[emailTerminator + 1],
				playCount: frameContent.readIntBE(emailTerminator + 2, frameContent.length - (emailTerminator + 3))
			};
		} else {
			this.identifier = "POPM";

			this.value = dataOrValue;
		}
	}

	/**
	 * Encode the content of the frame
	 * @param encodingOptions - The encoding options to encode with
	 * @returns The encoded content
	 */
	public encodeContent(){
		return Buffer.concat([
			Buffer.from(this.value.email, "latin1"),
			Buffer.from(new Uint8Array([ this.value.rating ])),
			bufferFromNumbers([
				this.value.playCount
			], this.value.playCount < 2 ** 32 - 1 ? 4 : undefined)
		]);
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