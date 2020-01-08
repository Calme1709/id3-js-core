import { ITagHeader } from "./utils";
import { decodeSize } from "../../utils";
import BaseDecoder from "./base";
import FrameType from './FrameTypes';
/**
 * The flags stored in the header of a ID3v2.2.x tag.
 */
interface IV2HeaderFlags {
	unsynchronisation: boolean;
	compressed: boolean;
}

/**
 * The information stored in a ID3v2.2.x tag
 */
export interface IV2TagInformation {
	header: ITagHeader<2, IV2HeaderFlags>;
	frames: any;
}

/**
 * The decoder for ID3v2.2.x
 */
export default class V2 extends BaseDecoder{
	/**
	 * Decode the tag from a buffer that is version ID3v2.2.x
	 * @param buffer - The buffer containing the tag
	 * @returns - The decoded tag
	 */
	public static decode(buffer: Buffer): IV2TagInformation{
		const tagOffset = buffer.indexOf("ID3");

		const headerBuffer = buffer.subarray(tagOffset, tagOffset + 10);

		const headerData = this.decodeHeader(headerBuffer);

		const bodyBuffer = buffer.subarray(tagOffset + 10, tagOffset + headerData.tagSize + 10);

		return {
			header: headerData,
			frames: this.decodeFrames(bodyBuffer)
		};
	}

	/**
	 * Decode the tag header of an ID3v2.2.x tag
	 * @param headerBuffer - The buffer containing the header
	 * @returns The decoded header
	 */
	private static decodeHeader(headerBuffer: Buffer): ITagHeader<2, IV2HeaderFlags>{
		const flagByte = headerBuffer[5].toString(2).padStart(8, "0");

		return {
			majorVersion: 2,
			revisionVersion: headerBuffer[4],
			tagSize: decodeSize(headerBuffer.subarray(6, 10)),
			flags: {
				unsynchronisation: flagByte[0] === "1",
				compressed: flagByte[1] === "1"
			}
		};
	}

	private static decodeFrames(bodyBuffer: Buffer): IV2Frames{
		const frames: {[key: string]: any} = {};

		let currentPosition = 0;

		while(currentPosition < bodyBuffer.length && bodyBuffer[currentPosition] !== 0x00){
			const frameName = bodyBuffer.toString("utf8", currentPosition, 3);
			const frameSize = bodyBuffer.readUIntBE(currentPosition + 3, 3);

			if(frameSize > (bodyBuffer.length - currentPosition)){
				break;
			}

			const frameBody = bodyBuffer.subarray(currentPosition + 6, currentPosition + frameSize + 6);

			const decodedFrame = this.decodeFrame(frameName, frameBody);

			if(this.frameCanHaveMultipleEntries(frameName)){
				if(frames[frameName] === undefined){
					frames[frameName] = [];
				}

				frames[frameName].push(decodedFrame);
			} else {
				frames[frameName] = decodedFrame;
			}

			currentPosition += frameSize + 6;
		}

		return frames;
	}

	/**
	 * Check if the frame can have multiple entries
	 * @param frameName - The frame
	 * @returns Whether there can be multiple entries
	 */
	private static frameCanHaveMultipleEntries(frameName: string){
		const frameWithMultipleEntries = [ "COM", "CRA", "CRM", "GEO", "LNK", "PIC", "POP", "SLT", "TXX", "UFI", "ULT", "WXX" ];

		return frameWithMultipleEntries.includes(frameName);
	}

	/**
	 * Decode a frame's body
	 * @param name - The name of the frame
	 * @param body - The body of the frame
	 * @returns The decoded frame body
	 */
	private static decodeFrame(name: string, body: Buffer){
		const frameType = this.getFrameType(name);

		switch(frameType){
			case FrameType.URL:
			case FrameType.TextInformation:
				return this.decodeTextInformationFrame(body);

			case FrameType.UserDefinedURL:
			case FrameType.UserDefinedTextInformation:
				return this.decodeUserDefinedTextInformationFrame(body);

			case FrameType.UniqueFileIdentifier:
				return this.decodeUniqueFileIdentifierFrame(body);

			case FrameType.InvolvedPeopleList:
				return this.decodeInvoledPeoplesListFrame(body);

			case FrameType.MusicCDIndentifier:
				return this.decodeMusicCDIndentifierFrame(body);

			case FrameType.EventTimingCodes:
				return this.decodeEventTimingCodesFrame(body);

			case FrameType.MPEGLocationLookupTable:
				return this.decodeMPEGLocationLookupTableFrame(body);

			case FrameType.SyncedTempoCodes:
				return this.decodeSyncedTempoCodesFrame(body);

			default:
				return undefined;
		}
	}

	/**
	 * Get the type of frame
	 * @param name - The name of the frame
	 * @returns The frame type
	 */
	private static getFrameType(name: string){
		if(name[0] === "T" && name !== "TXX"){
			return FrameType.TextInformation;
		}

		if(name[0] === "W" && name !== "WXX"){
			return FrameType.URL;
		}

		const frames: {[key: string]: FrameType} = {
			BUF: FrameType.RecommendedBufferSize,
			CNT: FrameType.PlayCounter,
			COM: FrameType.Comment,
			CRA: FrameType.AudioEncryption,
			CRM: FrameType.EncryptedMetaFrame,
			EQU: FrameType.Equalisation,
			ETC: FrameType.EventTimingCodes,
			GEO: FrameType.GeneralEncapsulatedObject,
			IPL: FrameType.InvolvedPeopleList,
			LNK: FrameType.LinkedInformation,
			MCI: FrameType.MusicCDIndentifier,
			MLL: FrameType.MPEGLocationLookupTable,
			PIC: FrameType.AttachedPicture,
			POP: FrameType.Popularimeter,
			REV: FrameType.Reverb,
			RVA: FrameType.RelativeVolumeAdjustment,
			SLT: FrameType.SynchronisedLyrics,
			STC: FrameType.SyncedTempoCodes,
			TXX: FrameType.UserDefinedTextInformation,
			UFI: FrameType.UniqueFileIdentifier,
			ULT: FrameType.UnsynchronisedLyrics,
			WXX: FrameType.UserDefinedURL
		};

		return frames[name];
	}
}