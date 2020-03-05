import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';
import { FlagByte, bufferFromNumbers } from '@utils';

/**
 * The deviation of a reference from the milliseconds and bytes that were stated
 */
interface IChannelAdjustment {
	/**
	 * Whether the adjustment is positive or negative
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
 * The value of a relative volume adjustment frame without back channels
 */
interface IRelativeVolumeAdjustmentValue {
	/**
	 * The right channel, if a right back channel is present in this frame this is to be treated as the front right channel
	 */
	right?: IChannelAdjustment;

	/**
	 * The left channel, if a left back channel is present in this frame this is to be treated as the front left channel
	 */
	left?: IChannelAdjustment;

	/**
	 * The left back channel
	 */
	leftBack?: IChannelAdjustment;

	/**
	 * The right back channel
	 */
	rightBack?: IChannelAdjustment;

	/**
	 * The center channel
	 */
	center?: IChannelAdjustment;

	/**
	 * The bass channel
	 */
	bass?: IChannelAdjustment;
}

/**
 * A relative volume adjustment frame
 */
export default class RelativeVolumeAdjustmentFrame extends Frame {
	/**
	 * The type of frame
	 */
	public frameType = "RELATIVEVOLUMEADJUSTMENTFRAME";

	/**
	 * The frame identifier
	 */
	public identifier!: string;

	/**
	 * The value of this relative volume adjustment frame
	 */
	public value: IRelativeVolumeAdjustmentValue;

	/**
	 * The default adjustment for a channel
	 */
	private readonly defaultAdjustment = {
		increment: false,
		peakVolume: 0,
		relativeVolumeAdjustment: 0
	};

	/**
	 * Decode a MPEG location lookup table frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new MPEG location lookup table frame
	 * @param value - The value of this MPEG location lookup table frame
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

		const leftChannel = this.value.left || this.defaultAdjustment;
		const rightChannel = this.value.right || this.defaultAdjustment;
		const leftBackChannel = this.value.leftBack || this.defaultAdjustment;
		const rightBackChannel = this.value.rightBack || this.defaultAdjustment;
		const centerChannel = this.value.center || this.defaultAdjustment;
		const bassChannel = this.value.bass || this.defaultAdjustment;

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