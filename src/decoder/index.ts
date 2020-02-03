import decodeTagHeader from "./decodeTagHeader";
import decodeFrameHeader from "./decodeFrameHeader";
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
	UnsynchronisedLyricsFrame
} from "../frames";

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

		const framesData = data.slice(tagOffset + tagHeader.headerSize, tagOffset + tagHeader.tagSize);

		let index = 0;
		const frames: Frame[] = [];

		while(index < tagHeader.tagSize - tagHeader.headerSize){
			const frameHeader = decodeFrameHeader(framesData.slice(index), tagHeader.version);

			const frameData = framesData.slice(index, index + frameHeader.frameSize);

			if(frameHeader.identifier[0] === "T" && ![ "TXX", "TXXX" ].includes(frameHeader.identifier)){
				frames.push(new TextInformationFrame(frameData, tagHeader.version));
			} else if(frameHeader.identifier[0] === "W" && ![ "WXX", "WXXX" ].includes(frameHeader.identifier)) {
				frames.push(new URLLinkFrame(frameData, tagHeader.version));
			} else {
				switch(frameHeader.identifier){
					case "UFI":
					case "UFID":
						frames.push(new UFIDFrame(frameData, tagHeader.version));
						break;

					case "TXX":
					case "TXXX":
						frames.push(new UserDefinedTextInformationFrame(frameData, tagHeader.version));
						break;

					case "WXX":
					case "WXXX":
						frames.push(new UserDefinedURLLinkFrame(frameData, tagHeader.version));
						break;

					case "IPL":
					case "IPLS":
						frames.push(new InvolvedPeopleListFrame(frameData, tagHeader.version));
						break;

					case "MCI":
					case "MCDI":
						frames.push(new MusicCDIdentifierFrame(frameData, tagHeader.version));
						break;

					case "ETC":
					case "ETCO":
						frames.push(new EventTimingCodesFrame(framesData, tagHeader.version));
						break;

					case "MLL":
					case "MLLT":
						frames.push(new MPEGLocationLookupTableFrame(framesData, tagHeader.version));
						break;

					case "STC":
					case "SYTC":
						frames.push(new SynchronisedTempoCodesFrame(framesData, tagHeader.version));
						break;

					case "ULT":
					case "USLT":
						frames.push(new UnsynchronisedLyricsFrame(framesData, tagHeader.version));
						break;

					default:
						throw new Error(`Unsupported frame type: ${frameHeader.identifier}`);
				}
			}

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
}