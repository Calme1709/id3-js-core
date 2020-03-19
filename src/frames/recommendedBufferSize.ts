import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';
import { bufferFromNumbers } from '@utils';

/**
 * The value of a recommended buffer size frame
 */
interface IRecommendedBufferSizeValue {
	/**
	 * The recommended buffer size
	 */
	bufferSize: number;

	/**
	 * If the this is true then this indicates that an ID3 tag with the maximum size described in 'bufferSize' may occur in the
	 * audio stream.
	 */
	embeddedInfo: boolean;

	/**
	 * This is the offset from the end of this tag to the first byte of the header of the next tag, this field can be omitted
	 */
	offsetToNextTag?: number;
}

/**
 * Recommended Buffer Size
 *
 * Sometimes the server from which a audio file is streamed is aware of transmission or coding problems resulting in
 * interruptions in the audio stream. In these cases, the size of the buffer can be recommended by the server using
 * this frame.
 *
 * There may only be one of this frame in each tag.
 */
export default class RecommendedBufferSizeFrame extends Frame<IRecommendedBufferSizeValue> {
	/**
	 * Decode a recommended buffer size frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new recommended buffer size frame
	 * @param value - The value of this recommended buffer size frame
	 */
	public constructor(value: IRecommendedBufferSizeValue);
	public constructor(dataOrValue: Buffer | IRecommendedBufferSizeValue, ID3Version?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, ID3Version as 2 | 3 | 4);

			const frameContent = dataOrValue.slice(headerInfo.headerSize);

			this.value = {
				bufferSize: frameContent.readUIntBE(0, 3),
				embeddedInfo: frameContent[3] === 1,
				offsetToNextTag: frameContent.length > 4 ? frameContent.readUIntBE(4, 3) : undefined
			};
		} else {
			this.identifier = "RBUF";

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
			bufferFromNumbers([
				this.value.bufferSize
			], 3),
			bufferFromNumbers([
				this.value.embeddedInfo ? 1 : 0
			], 1),
			this.value.offsetToNextTag !== undefined ? bufferFromNumbers([
				this.value.offsetToNextTag
			], 3) : Buffer.alloc(0)
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