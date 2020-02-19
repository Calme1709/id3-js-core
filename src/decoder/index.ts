import decodeTagHeader from "./decodeTagHeader";
import decodeFrameHeader, { IFrameHeader } from "./decodeFrameHeader";
import { Buffer } from "buffer";

import {
	Frame,
	TextInformationFrame,
	URLLinkFrame,
	UFIDFrame,
	UserDefinedTextInformationFrame,
	UserDefinedURLLinkFrame,
	InvolvedPeopleListFrame,
	MusicCDIdentifierFrame,
	EventTimingCodesFrame,
	MPEGLocationLookupTableFrame,
	SynchronisedTempoCodesFrame,
	UnsynchronisedLyricsFrame,
	SynchronisedLyricsFrame,
	CommentFrame
} from "@frames";
import { Unsynchronisation } from "@utils";

/**
 * The decoder class
 */
export default class Decoder {
	/**
	 * Decode a tag from a buffer
	 * @param data - The buffer that contains the ID3 tag to decode
	 * @returns - The decoded tag
	 */
	public static decode(data: Buffer){
		const tagOffset = data.indexOf("ID3");

		if(tagOffset === -1){
			throw new Error("No ID3 tag was found in the supplied data");
		}

		const tagHeader = decodeTagHeader(data.slice(tagOffset));

		const unsynchronisedFrameData = data.slice(tagOffset + tagHeader.headerSize, tagOffset + tagHeader.tagSize);

		const framesData = tagHeader.unsynchronisation ?
			Unsynchronisation.decode(unsynchronisedFrameData) :
			unsynchronisedFrameData;

		let index = 0;
		const frames: Frame[] = [];

		while(index < framesData.length && !(framesData[index] === 0x00 && framesData[index + 1] === 0x00)){
			const frameHeader = decodeFrameHeader(framesData.slice(index), tagHeader.version);

			frames.push(this.decodeFrame(frameHeader, framesData.slice(index, index + frameHeader.frameSize), tagHeader.version));

			index += frameHeader.frameSize;
		}

		return {
			header: tagHeader,
			frames
		};
	}

	/**
	 * Decode and set data from the header
	 * @param data - The buffer of the data to decode
	 * @param ID3Version - The version of the ID3v2 spec to adhere to when decoding the header
	 * @returns An object containing some information that was stored in, and about the header
	 */
	public static decodeFrameHeader(data: Buffer, ID3Version: 2 | 3 | 4){
		return decodeFrameHeader(data, ID3Version);
	}

	/**
	 * Decode a frame and return it
	 * @param frameHeader - The header data of the frame, this is used to find which method of decoding is to be used
	 * @param frameData - The frame data, this is the data that makes up the frame
	 * @param ID3Version - The ID3 version used to decode the frame
	 * @retuns The decode frame
	 */
	private static decodeFrame(frameHeader: IFrameHeader, frameData: Buffer, ID3Version: 2 | 3 | 4){
		if(frameHeader.identifier[0] === "T" && ![ "TXX", "TXXX" ].includes(frameHeader.identifier)){
			return new TextInformationFrame(frameData, ID3Version);
		} else if(frameHeader.identifier[0] === "W" && ![ "WXX", "WXXX" ].includes(frameHeader.identifier)) {
			return new URLLinkFrame(frameData, ID3Version);
		} else {
			switch(frameHeader.identifier){
				case "UFI":
				case "UFID":
					return new UFIDFrame(frameData, ID3Version);

				case "TXX":
				case "TXXX":
					return new UserDefinedTextInformationFrame(frameData, ID3Version);

				case "WXX":
				case "WXXX":
					return new UserDefinedURLLinkFrame(frameData, ID3Version);

				case "IPL":
				case "IPLS":
					return new InvolvedPeopleListFrame(frameData, ID3Version);

				case "MCI":
				case "MCDI":
					return new MusicCDIdentifierFrame(frameData, ID3Version);

				case "ETC":
				case "ETCO":
					return new EventTimingCodesFrame(frameData, ID3Version);

				case "MLL":
				case "MLLT":
					return new MPEGLocationLookupTableFrame(frameData, ID3Version);

				case "STC":
				case "SYTC":
					return new SynchronisedTempoCodesFrame(frameData, ID3Version);

				case "ULT":
				case "USLT":
					return new UnsynchronisedLyricsFrame(frameData, ID3Version);

				case "SLT":
				case "SYLT":
					return new SynchronisedLyricsFrame(frameData, ID3Version);

				case "COM":
				case "COMM":
					return new CommentFrame(frameData, ID3Version);

				default:
					throw new Error(`Unsupported frame type: ${frameHeader.identifier}`);
			}
		}
	}
}