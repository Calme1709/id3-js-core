import decodeTagHeader from "./decodeTagHeader";
import decodeFrameHeader from "./decodeFrameHeader";
import { Buffer } from "buffer";
import Frame from "../frames/frameComponents/frame";

import { TextInformationFrame, URLLinkFrame } from "../frames";

export default class Decoder {
	public static decode(data: Buffer){
		const tagOffset = data.indexOf("ID3");

		if(tagOffset === -1){
			throw new Error("No ID3 tag was found in the supplied data");
		}

		const tagHeader = decodeTagHeader(data.slice(tagOffset));

		const framesData = data.slice(tagOffset + tagHeader.headerSize, tagOffset + tagHeader.tagSize);

		console.log(framesData.length);

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
				console.log(frameHeader.identifier);
				//SWITCH
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