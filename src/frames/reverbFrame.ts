import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';

/**
 * The value of a reverb frame
 */
interface IReverbValue {
	/**
	 * This is the amount of delay (in ms) in a left bounce.
	 */
	reverbLeft: number;

	/**
	 * This is the amount of delay (in ms) for a right bounce.
	 */
	reverbRight: number;

	/**
	 * The amount of left bounces that should be made, $FF is infinite
	 */
	reverbBouncesLeft: number;

	/**
	 * The amount of right bounces that should be made, $FF is infinite
	 */
	reverbBouncesRight: number;

	/**
	 * The amount of sound that bounces from left to left, this is stored as a percentage with $00 being 0% and $FF being 100%
	 */
	reverbFeedbackLeftToLeft: number;

	/**
	 * The amount of sound that bounces from left to right, this is stored as a percentage with $00 being 0% and $FF being 100%
	 */
	reverbFeedbackLeftToRight: number;

	/**
	 * The amount of sound that bounces from right to left, this is stored as a percentage with $00 being 0% and $FF being 100%
	 */
	reverbFeedbackRightToLeft: number;

	/**
	 * The amount of sound that bounces from right to right, this is stored as a percentage with $00 being 0% and $FF being 100%
	 */
	reverbFeedbackRightToRight: number;

	/**
	 * This is the amount of left sound to be mixed in the right before any reverb is applied, where $00 is 0% and $FF is 100%
	 */
	premixLeftToRight: number;

	/**
	 * This is the amount of right sound to be mixed in the left before any reverb is applied, where $00 is 0% and $FF is 100%
	 */
	premixRightToLeft: number;
}

/**
 * Reverb
 *
 * This is a subjective frame. It allows the user to adjust echoes of different kinds.
 *
 * There may only be one of this frame in a tag.
 */
export default class ReverbFrame extends Frame<IReverbValue> {
	/**
	 * Decode a reverb frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new reverb frame
	 * @param value - The value of this reverb
	 */
	public constructor(value: IReverbValue);
	public constructor(dataOrValue: Buffer | IReverbValue, ID3Version?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, ID3Version as 2 | 3 | 4);

			const frameContent = dataOrValue.slice(headerInfo.headerSize);

			this.value = {
				reverbLeft: frameContent.readInt16BE(0),
				reverbRight: frameContent.readInt16BE(2),
				reverbBouncesLeft: frameContent[4],
				reverbBouncesRight: frameContent[5],
				reverbFeedbackLeftToLeft: frameContent[6],
				reverbFeedbackLeftToRight: frameContent[7],
				reverbFeedbackRightToRight: frameContent[8],
				reverbFeedbackRightToLeft: frameContent[9],
				premixLeftToRight: frameContent[10],
				premixRightToLeft: frameContent[11]
			};
		} else {
			this.identifier = "RVRB";

			this.value = dataOrValue;
		}
	}

	/**
	 * Encode the content of the frame
	 * @param encodingOptions - The encoding options to encode with
	 * @returns The encoded content
	 */
	public encodeContent(){
		const buffer = Buffer.alloc(0xC);

		buffer.writeInt16BE(this.value.reverbLeft, 0);
		buffer.writeInt16BE(this.value.reverbLeft, 2);

		return Buffer.concat([
			buffer,
			Buffer.from(new Uint8Array([
				this.value.reverbBouncesLeft,
				this.value.reverbBouncesRight,
				this.value.reverbBouncesLeft,
				this.value.reverbBouncesRight,
				this.value.reverbFeedbackLeftToLeft,
				this.value.reverbFeedbackLeftToRight,
				this.value.reverbFeedbackRightToRight,
				this.value.reverbFeedbackRightToLeft,
				this.value.premixLeftToRight,
				this.value.premixRightToLeft
			]))
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