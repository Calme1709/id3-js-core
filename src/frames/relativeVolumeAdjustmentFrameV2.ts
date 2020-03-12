import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';

/**
 * An adjustment to a specified channel
 */
interface IChannelAdjustment {
	/**
	 * The channel that this adjustment should be applied to, the channel is represented as is shown below;
	 *
	 * 0: Other
	 *
	 * 1: Master volume
	 *
	 * 2: Front right
	 *
	 * 3: Front left
	 *
	 * 4: Back right
	 *
	 * 5: Back left
	 *
	 * 6: Front centre
	 *
	 * 7: Back centre
	 *
	 * 8: Subwoofer
	 */
	channelType: number;

	/**
	 * The volume adjustment for this channel.
	 *
	 * This is encoded as a fixed point decibel value, 16 bit signed integer representing (adjustment*512), giving a range of
	 * +/- 64 dB with a precision of 0.001953125 dB.
	 */
	relativeVolumeAdjustment: number;

	/**
	 * The peak volume for this channel, set to zero if unknown
	 */
	peakVolume?: number;
}

/**
 * The value of a Relative Volume Adjustment V2 frame
 */
interface IRelativeVolumeAdjustmentV2Value {
	/**
	 * This is a string that is used to identify the situation and/or device where this adjustment should apply.
	 */
	identificationString: string;

	/**
	 * The adjustments that are applied to the different audio channels
	 */
	adjustments: IChannelAdjustment[];
}

/**
 * Relative Volume Adjustment V2
 *
 * This is a more subjective frame. It allows the user to say how much they want to increase/decrease
 * the volume on each channel when the file is played. The purpose is to be able to align all files to a reference volume,
 * so that you don’t have to change the volume constantly. This frame may also be used to balance adjust the audio.
 *
 * There may be more than one of this frame in each tag, but only one with the same identification string.
 */
export default class RelativeVolumeAdjustmentV2Frame extends Frame<IRelativeVolumeAdjustmentV2Value> {
	/**
	 * Decode a relative volume adjustment v2 frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new Relative Volume Adjustment V2 frame
	 * @param value - The value of this Relative Volume Adjustment V2 frame
	 */
	public constructor(value: IRelativeVolumeAdjustmentV2Value);
	public constructor(dataOrValue: Buffer | IRelativeVolumeAdjustmentV2Value, ID3Version?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, ID3Version as 3 | 4);
			const frameContent = dataOrValue.slice(headerInfo.headerSize);

			this.value = {
				identificationString: frameContent.slice(0, frameContent.indexOf(0x00)).toString("latin1"),
				adjustments: []
			};

			let index = frameContent.indexOf(0x00) + 1;

			while(frameContent.length - 1 > index){
				const bytesRepresentingPeak = Math.ceil(frameContent[index + 3] / 8);

				const adjustment: IChannelAdjustment = {
					channelType: frameContent[index],
					relativeVolumeAdjustment: frameContent.readInt16BE(index + 1)
				};

				if(bytesRepresentingPeak > 0){
					adjustment.peakVolume = frameContent.readIntBE(index + 4, bytesRepresentingPeak);
				}

				this.value.adjustments.push(adjustment);

				index += bytesRepresentingPeak + 4;
			}
		} else {
			this.identifier = "RVA2";

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
			Buffer.from(this.value.identificationString),
			...this.value.adjustments.map(adjustment => {
				const bytesForPeakVolume = Math.ceil(Math.log2((adjustment.peakVolume || 0) + 1) / 8);

				const buffer = Buffer.alloc(bytesForPeakVolume + 4);

				buffer.writeInt8(adjustment.channelType, 0);
				buffer.writeInt16BE(adjustment.relativeVolumeAdjustment, 1);
				buffer.writeInt8(bytesForPeakVolume * 8, 3);

				if(adjustment.peakVolume !== undefined && adjustment.peakVolume > 0){
					buffer.writeIntBE(adjustment.peakVolume, 4, bytesForPeakVolume);
				}

				return buffer;
			})
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
			reason: "Relative volume adjustment v2 frames are only supported in ID3v2.4"
		};
	}
}