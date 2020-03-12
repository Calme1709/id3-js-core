import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';

/**
 * The adjustment for a specific frequency
 */
interface IAdjustment {
	/**
	 * Whether the adjustment is positive (true) or negative (false)
	 */
	increment: boolean;

	/**
	 * The frequency that this adjustment is related to
	 */
	frequency: number;

	/**
	 * The adjustment to the volume at the related frequency
	 */
	adjustment: number;
}

/**
 * The value of an equalisation frame
 */
interface IEqualisationValue {
	/**
	 * The adjustments to occur at various frequencies.
	 *
	 * The adjustments should be ordered increasingly with reference to frequency. Not all frequencies have to be declared.
	 */
	adjustments: IAdjustment[];
}

/**
 * Equalisation
 *
 * This is a subjective, alignment frame. It allows the user to predefine an equalisation curve within the audio file.
 *
 * There may only be one of this frame in a tag.
 */
export default class EqualisationFrame extends Frame<IEqualisationValue> {
	/**
	 * Decode an equalisation frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new equalisation frame
	 * @param value - The value of this equalisation
	 */
	public constructor(value: IEqualisationValue);
	public constructor(dataOrValue: Buffer | IEqualisationValue, ID3Version?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, ID3Version as 2 | 3 | 4);

			const frameContent = dataOrValue.slice(headerInfo.headerSize);

			const adjustmentBytes = Math.ceil(frameContent[0] / 8);

			const adjustments: IAdjustment[] = [];

			for(let index = 1; index < frameContent.length; index += adjustmentBytes + 2){
				const frequencyBytes = frameContent.readUInt16BE(index);

				adjustments.push({
					//MSB of frequency is set
					increment: frequencyBytes >= 32768,
					//Frequency with the MSB removed if it is present
					frequency: frequencyBytes % 32768,
					adjustment: frameContent.readIntBE(index + 2, adjustmentBytes)
				});
			}

			this.value = {
				adjustments
			};
		} else {
			this.identifier = "EQUA";

			this.value = dataOrValue;
		}
	}

	/**
	 * Encode the content of the frame
	 * @param encodingOptions - The encoding options to encode with
	 * @returns The encoded content
	 */
	public encodeContent(){
		const maxAdjustment = Math.max(...this.value.adjustments.map(adjustment => adjustment.adjustment));
		const adjustmentBytes = Math.ceil(Math.ceil(Math.log2(maxAdjustment + 1)) / 8);

		return Buffer.concat([
			Buffer.from(new Uint8Array([
				adjustmentBytes * 8
			])),
			Buffer.concat(this.value.adjustments.map(adjustment => {
				const buffer = Buffer.alloc(adjustmentBytes + 2);

				buffer.writeUInt16BE(adjustment.frequency + (adjustment.increment ? 32768 : 0), 0);
				buffer.writeIntBE(adjustment.adjustment, 2, adjustmentBytes);

				return buffer;
			}))
		]);
	}

	/**
	 * Test if the content of this frame can be encoded with the specified version
	 * @param version - The version to test
	 * @returns Whether the content can be encoded with the specified version
	 */
	protected contentSupportsVersion(version: number): IVersionSupport {
		if(version === 4){
			return {
				supportsVersion: false,
				reason: "Equalisation frame is not supported in ID3v2.4"
			};
		}

		return {
			supportsVersion: true,
			reason: ""
		};
	}
}