import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';
import { FlagByte, bufferFromNumbers } from '@utils';

/**
 * An adjustment to an audio channel
 */
interface IChannelAdjustment {
	/**
	 * Whether the adjustment is positive (true) or negative (false)
	 */
	increment: boolean;

	/**
	 * The relative volume adjustment for this channel
	 */
	relativeVolumeAdjustment: number;

	/**
	 * The peak volume for this channel
	 */
	peakVolume: number;
}

/**
 * The value of a relative volume adjustment frame
 */
interface IRelativeVolumeAdjustmentValue {
	/**
	 * The adjustment to the right channel, if a right back channel adjustment is present in this frame this is to be treated as
	 * the front right channel
	 */
	right?: IChannelAdjustment;

	/**
	 * The adjustment to the left channel, if a left back channel adjustment is present in this frame this is to be treated as
	 * the front left channel
	 */
	left?: IChannelAdjustment;

	/**
	 * The adjustment to the left back channel, this is not required and is only supported in ID3v2.3
	 */
	leftBack?: IChannelAdjustment;

	/**
	 * The adjustment to the right back channel, this is not required and is only supported in ID3v2.3
	 */
	rightBack?: IChannelAdjustment;

	/**
	 * The adjustment to the center channel, this is not required and is only supported in ID3v2.3
	 */
	center?: IChannelAdjustment;

	/**
	 * The adjustment to the bass channel, this is not required and is only supported in ID3v2.3
	 */
	bass?: IChannelAdjustment;
}

/**
 * Relative Volume Adjustment
 *
 * This is a subjective frame,  It allows the user to say how much he wants to increase/decrease the volume on each channel
 * while the file is played. The purpose is to be able to align all files to a reference volume, so that you don’t have to
 * change the volume constantly. This frame may also be used to balance adjust the audio.
 *
 * There may only be one of this frame in a tag.
 */
export default class RelativeVolumeAdjustmentFrame extends Frame<IRelativeVolumeAdjustmentValue> {
	/**
	 * Decode a relative volume adjustment frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new relative volume adjustment frame
	 * @param value - The value of this relative volume adjustment frame
	 */
	public constructor(value: IRelativeVolumeAdjustmentValue);
	public constructor(dataOrValue: Buffer | IRelativeVolumeAdjustmentValue, ID3Version?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, ID3Version as 3 | 4);

			const frameContent = dataOrValue.slice(headerInfo.headerSize);

			const incrementByte = frameContent[0]
				.toString(2)
				.padStart(8, "0")
				.split("")
				.map(char => char === "1")
				.reverse();

			const volDescLength = Math.ceil(frameContent[1] / 8);

			const containsBackChannels = frameContent.length > volDescLength * 4 + 2;
			const containsCenterChannel = frameContent.length > volDescLength * 8 + 2;
			const containsBassChannel = frameContent.length > volDescLength * 10 + 2;

			this.value = {
				right: {
					increment: incrementByte[0],
					relativeVolumeAdjustment: frameContent.readIntBE(2, volDescLength),
					peakVolume: frameContent.readIntBE((volDescLength * 2) + 2, volDescLength)
				},
				left: {
					increment: incrementByte[1],
					relativeVolumeAdjustment: frameContent.readIntBE(volDescLength + 2, volDescLength),
					peakVolume: frameContent.readIntBE((volDescLength * 3) + 2, volDescLength)
				},
				rightBack: containsBackChannels ? {
					increment: incrementByte[2],
					relativeVolumeAdjustment: frameContent.readIntBE((volDescLength * 4) + 2, volDescLength),
					peakVolume: frameContent.readIntBE((volDescLength * 6) + 2, volDescLength)
				} : undefined,
				leftBack: containsBackChannels ? {
					increment: incrementByte[3],
					relativeVolumeAdjustment: frameContent.readIntBE((volDescLength * 5) + 2, volDescLength),
					peakVolume: frameContent.readIntBE((volDescLength * 7) + 2, volDescLength)
				} : undefined,
				center: containsCenterChannel ? {
					increment: incrementByte[4],
					relativeVolumeAdjustment: frameContent.readIntBE((volDescLength * 8) + 2, volDescLength),
					peakVolume: frameContent.readIntBE((volDescLength * 9) + 2, volDescLength)
				} : undefined,
				bass: containsBassChannel ? {
					increment: incrementByte[5],
					relativeVolumeAdjustment: frameContent.readIntBE((volDescLength * 10) + 2, volDescLength),
					peakVolume: frameContent.readIntBE((volDescLength * 11) + 2, volDescLength)
				} : undefined
			};
		} else {
			this.identifier = "RVAD";

			this.value = dataOrValue;
		}
	}

	/**
	 * Encode the content of the frame
	 * @param encodingOptions - The encoding options to encode with
	 * @returns The encoded content
	 */
	public encodeContent(){
		const volumeDescriptions = [
			this.value.right,
			this.value.left,
			this.value.rightBack,
			this.value.leftBack,
			this.value.center,
			this.value.bass
		].map(channel => [
			channel?.peakVolume || 0,
			channel?.relativeVolumeAdjustment || 0
		]).flat(1);

		const bytesForVolDesc = Math.ceil(Math.log2(Math.max(...volumeDescriptions) + 1) / 8);

		const defaultAdjustment = {
			increment: false,
			peakVolume: 0,
			relativeVolumeAdjustment: 0
		};

		const leftChannel = this.value.left || defaultAdjustment;
		const rightChannel = this.value.right || defaultAdjustment;
		const leftBackChannel = this.value.leftBack || defaultAdjustment;
		const rightBackChannel = this.value.rightBack || defaultAdjustment;
		const centerChannel = this.value.center || defaultAdjustment;
		const bassChannel = this.value.bass || defaultAdjustment;

		const v3Channels = [
			this.value.bass,
			this.value.center,
			this.value.leftBack,
			this.value.rightBack
		];

		return Buffer.concat([
			Buffer.from(new Uint8Array([
				FlagByte.encode([
					false,
					false,
					bassChannel.increment,
					centerChannel.increment,
					leftBackChannel.increment,
					rightBackChannel.increment,
					leftChannel.increment,
					rightChannel.increment
				]),
				bytesForVolDesc * 8
			])),
			bufferFromNumbers([
				rightChannel.relativeVolumeAdjustment,
				leftChannel.relativeVolumeAdjustment,
				rightChannel.peakVolume,
				leftChannel.peakVolume,
				...(v3Channels.some(channel => channel !== undefined) ? [
					rightBackChannel.relativeVolumeAdjustment,
					leftBackChannel.relativeVolumeAdjustment,
					rightBackChannel.peakVolume,
					leftBackChannel.peakVolume,
					centerChannel.relativeVolumeAdjustment,
					centerChannel.peakVolume,
					bassChannel.relativeVolumeAdjustment,
					bassChannel.peakVolume
				] : [])
			], bytesForVolDesc)
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
				reason: "Relative volume adjustment frame is not supported in ID3v2.4"
			};
		}

		const v3Channels = [ this.value.bass, this.value.center, this.value.leftBack, this.value.rightBack ];

		if(version === 2 && v3Channels.some(channel => channel !== undefined)){
			return {
				supportsVersion: false,
				reason: "ID3v2.2 does not support the inclusion of bass, center, or back channels in the relative volume adjustment frame"
			};
		}

		return {
			supportsVersion: true,
			reason: ""
		};
	}
}