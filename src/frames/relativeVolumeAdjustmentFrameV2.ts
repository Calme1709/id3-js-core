import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';

/**
 * The deviation of a reference from the milliseconds and bytes that were stated
 */
interface IChannelAdjustment {
	/**
	 * The type of channel that this is;
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
	 * The relative volume adjustment for this channel
	 */
	relativeVolumeAdjustment: number;

	/**
	 * The peak volume for this channel
	 */
	peakVolume?: number;
}

/**
 * The value of a relative volume adjustment v2 frame
 */
interface IRelativeVolumeAdjustmentV2Value {
	identificationString: string;

	channels: IChannelAdjustment[];
}

/**
 * A relative volume adjustment v2 frame
 */
export default class RelativeVolumeAdjustmentV2Frame extends Frame {
	/**
	 * The frame identifier
	 */
	public identifier!: string;

	/**
	 * The value of this relative volume adjustment frame
	 */
	public value: IRelativeVolumeAdjustmentV2Value;

	/**
	 * Decode a relative volume adjustment v2 frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a newrelative volume adjustment v2 frame
	 * @param value - The value of this relative volume adjustment v2 frame
	 */
	public constructor(value: IRelativeVolumeAdjustmentV2Value);
	public constructor(dataOrValue: Buffer | IRelativeVolumeAdjustmentV2Value, ID3Version?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, ID3Version as 3 | 4);

			const frameContent = dataOrValue.slice(headerInfo.headerSize);

			const identificationString = frameContent.slice(0, frameContent.indexOf(0x00)).toString("latin1");
			const channels: IChannelAdjustment[] = [];

			let index = frameContent.indexOf(0x00) + 1;

			while(frameContent.length - 1 > index){
				const bitsRepresentingPeak = frameContent[index + 3];

				const channel: IChannelAdjustment = {
					channelType: frameContent[index],
					relativeVolumeAdjustment: frameContent.readInt16BE(index + 1)
				};

				if(bitsRepresentingPeak > 0){
					channel.peakVolume = frameContent.readIntBE(index + 4, Math.ceil(bitsRepresentingPeak / 8));
				}

				channels.push(channel);

				index += Math.ceil(bitsRepresentingPeak / 8) + 4;
			}

			this.value = {
				identificationString,
				channels
			};
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
			...this.value.channels.map(channel => {
				const bytesForPeakVolume = Math.ceil(Math.log2((channel.peakVolume || 0) + 1) / 8);

				const buffer = Buffer.alloc(bytesForPeakVolume + 4);

				buffer.writeInt8(channel.channelType, 0);
				buffer.writeInt16BE(channel.relativeVolumeAdjustment, 1);
				buffer.writeInt8(bytesForPeakVolume * 8, 3);

				if(channel.peakVolume !== undefined && channel.peakVolume > 0){
					buffer.writeIntBE(channel.peakVolume, 4, bytesForPeakVolume);
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