import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';

/**
 * The adjustment that is to be applied to a specified frequency
 */
interface IAdjustment {
	/**
	 * The frequency that this adjustment should be applied to.
	 *
	 * This is stored in units of 1/2 Hz.
	 */
	frequency: number;

	/**
	 * The adjustment to be applied
	 *
	 * The volume adjustment is stored as a 16 bit signed integer representing adjustment*512,
	 * giving a range of +/- 64 dB with a precision of 0.001953125 dB
	 */
	volumeAdjustment: number;
}

/**
 * The value of an equalisation V2 frame
 */
interface IEqualisationV2Value {
	/**
	 * This is a string that is used to identify the situation and/or device where this adjustment should apply.
	 */
	identification: string;

	/**
	 * The method which is preferred when an interpolation between the adjustment point that follows.
	 * The following methods are currently defined:
	 *
	 * 0 (Band) - No interpolation is made. A jump from one adjustment level to another occurs in the middle between
	 * two adjustment points.
	 *
	 * 1 (Linear) - Interpolation between adjustment points is linear.
	 */
	interpolationMethod: number;

	/**
	 * The adjustment points that makes up the equalisation curve
	 *
	 * Adjustments should be ordered by frequency and a frequency should only occur once in the frame
	 */
	adjustments: IAdjustment[];
}

/**
 * Equalisation V2
 *
 * This is a subjective, alignment frame. It allows the user to predefine an
 * equalisation curve within the audio file.
 *
 * There may be more than one of this frame in each tag, but only one with the same identification string.
 */
export default class EqualisationV2Frame extends Frame<IEqualisationV2Value> {
	/**
	 * Decode an equalisation V2 frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new equalisation V2 frame
	 * @param value - The value of this equalisation v2 frame
	 */
	public constructor(value: IEqualisationV2Value);
	public constructor(dataOrValue: Buffer | IEqualisationV2Value, ID3Version?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, ID3Version as 2 | 3 | 4);

			const frameContent = dataOrValue.slice(headerInfo.headerSize);

			const endOfIdentification = frameContent.indexOf(0x00, 1);

			const adjustments: IAdjustment[] = [];

			for(let index = endOfIdentification + 1; index < frameContent.length; index += 4){
				adjustments.push({
					frequency: frameContent.readUInt16BE(index),
					volumeAdjustment: frameContent.readInt16BE(index + 2)
				});
			}

			this.value = {
				interpolationMethod: frameContent[0],
				identification: frameContent.slice(1, endOfIdentification).toString("latin1"),
				adjustments
			};
		} else {
			this.identifier = "EQU2";

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
			Buffer.from(new Uint8Array([
				this.value.interpolationMethod
			])),
			Buffer.from(this.value.identification, "latin1"),
			Buffer.from(new Uint8Array([
				0x00
			])),
			Buffer.concat(
				this.value.adjustments.map(adjustment => {
					const buffer = Buffer.alloc(4);

					buffer.writeInt16BE(adjustment.frequency, 0);
					buffer.writeInt16BE(adjustment.volumeAdjustment, 2);

					return buffer;
				})
			)
		]);
	}

	/**
	 * Test if the content of this frame can be encoded with the specified version
	 * @param version - The version to test
	 * @returns Whether the content can be encoded with the specified version
	 */
	protected contentSupportsVersion(version: number): IVersionSupport {
		return version === 4 ? {
			supportsVersion: true,
			reason: ""
		} : {
			supportsVersion: false,
			reason: "Equalisation v2 frames are only supported in ID3v2.4"
		};
	}
}