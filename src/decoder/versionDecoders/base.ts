import Utils from './utils';
import { IRelativeVolumeAdjustment } from './FrameTypes';
import {
	IEventTimingCodes,
	InvolvedPeopleList,
	IUserDefinedTextInformation,
	IUniqueFileIdentifier,
	IMpegLookupTable,
	ISpecialTextFrame,
	ISynchronisedLyrics
} from './FrameTypes';

/**
 * The base decoder, contains common logic between all versions
 */
export default class BaseDecoder {
	/**
	 * Decode a text information frame
	 * @param body - The frame body buffer
	 * @returns The decoded information from the text information frame
	 */
	protected static decodeTextInformationFrame(body: Buffer): string {
		return body.slice(1).toString(Utils.getEncoding(body[0]));
	}

	/**
	 * Decode a user defined text information frame
	 * @param body - The frame body buffer
	 * @returns The decoded information from the user defined text information frame
	 */
	protected static decodeUserDefinedTextInformationFrame(body: Buffer): IUserDefinedTextInformation {
		const nullByteLength = Utils.getNullByteLength(body[0]);
		const encoding = Utils.getEncoding(body[0]);
		const descriptorEndNullByteIndex = nullByteLength === 1 ? body.indexOf(0x00) : Utils.indexOfDoubleZeroByte(body);

		return {
			description: body.subarray(0, descriptorEndNullByteIndex).toString(encoding),
			value: body.subarray(descriptorEndNullByteIndex + nullByteLength).toString(encoding)
		};
	}

	/**
	 * Decode a unique file identifier frame
	 * @param body - The frame body buffer
	 * @returns The decoded information of the frame
	 */
	protected static decodeUniqueFileIdentifierFrame(body: Buffer): IUniqueFileIdentifier {
		//FIXME - Decode identifier data
		const ownerIdentifierEnd = body.indexOf(0x00);

		if(ownerIdentifierEnd === 0){
			return undefined;
		}

		return {
			ownerIdentifier: body.subarray(0, ownerIdentifierEnd).toString("ISO-8859-1"),
			identifier: body.subarray(ownerIdentifierEnd + 1).toString("hex")
		};
	}

	/**
	 * Decode an involved peoples list frame
	 * @param body - The frame body buffer
	 * @returns The decoded information of the frame
	 */
	protected static decodeInvoledPeoplesListFrame(body: Buffer): InvolvedPeopleList {
		const involvedPeople: {[key: string]: string} = {};

		const nullByteLength = Utils.getNullByteLength(body[0]);
		const encoding = Utils.getEncoding(body[0]);

		const parts: Buffer[] = [];
		let offset = 0;

		while(offset < body.length){
			const partEnd = nullByteLength === 2 ? Utils.indexOfDoubleZeroByte(body, offset) : body.indexOf(0x00, offset);

			const part = body.subarray(offset, partEnd);
			parts.push(part);

			offset += part.length;
		}

		for(let i = 0; i < parts.length; i += 2){
			involvedPeople[parts[i].toString(encoding)] = parts[i + 1].toString(encoding);
		}

		return involvedPeople;
	}

	/**
	 * Decode a music CD identifier frame
	 * @param body - The frame body buffer
	 * @returns The decoded information of the frame
	 */
	protected static decodeMusicCDIndentifierFrame(body: Buffer): string {
		return body.toString("hex");
	}

	/**
	 * Decode an event timing codes frame
	 * @param body - The frame body buffer
	 * @returns The decoded information of the frame
	 */
	protected static decodeEventTimingCodesFrame(body: Buffer): IEventTimingCodes {
		const eventNames = {
			"00": "padding",
			"01": "end of initial silence",
			"02": "intro start",
			"03": "mainpart start",
			"04": "outro start",
			"05": "outro end",
			"06": "verse start",
			"07": "refrain start",
			"08": "interlude start",
			"09": "theme start",
			"0A": "variation start",
			"0B": "key change",
			"0C": "time change",
			"0D": "momentary unwanted noise",
			"0E": "sustained noise",
			"0F": "sustained noise end",
			10: "intro end",
			11: "mainpart end",
			12: "verse end",
			13: "refrain end",
			14: "theme end",
			15: "profanity",
			16: "profanity end",
			FD: "audio end",
			FE: "audio file ends"
		};

		const events = [];

		for(let i = 0; i < body.length; i += 5){
			const event = body[i].toString(16);
			const time = body.readInt32BE(i + 1);

			if(event in eventNames){
				events.push({
					eventType: eventNames[event],
					time
				});
			} else if(body[i] >= 0xE0 && body[i] <= 0xEF){
				events.push({
					eventType: `user defined event ${(body[i] - 0xE0).toString(10)}`,
					time
				});
			}
		}

		return {
			timestampUnit: Utils.decodeTimestampUnit(body[0]),
			events
		};
	}

	/**
	 * Decode a MPEG Location Lookup Table frame
	 * @param body - The frames body
	 * @returns The decoded frame
	 */
	protected static decodeMPEGLocationLookupTableFrame(body: Buffer): IMpegLookupTable{
		// tslint:disable-next-line: no-bitwise
		const bytesBetweenReferences = (body[2] << 16) | (body[3] << 8) | (body[4]);
		// tslint:disable-next-line: no-bitwise
		const millisecondsBetweenReferences = (body[5] << 16) | (body[6] << 8) | (body[7]);

		const bitsForBytesDeviation = body[8];
		const bitsForMillisecondsDeviation = body[9];

		const references = [];

		let bits = "";
		body.subarray(10).forEach(byte => bits += byte.toString(2));

		for(let i = 0; i < bits.length; i += bitsForBytesDeviation + bitsForMillisecondsDeviation){
			references.push({
				byteDeviation: parseInt(bits.substr(i, bitsForBytesDeviation), 2),
				millisecondDeviation: parseInt(bits.substr(i + bitsForBytesDeviation, bitsForMillisecondsDeviation), 2)
			});
		}

		return {
			framesBetweenReferences: body.readInt16BE(0),
			bytesBetweenReferences,
			millisecondsBetweenReferences,
			references
		};
	}

	/**
	 * Decode a synchronised tempo codes frame
	 * @param body - The frames body
	 * @returns The decoded frame
	 */
	protected static decodeSyncedTempoCodesFrame(body: Buffer){
		//FIXME - Decode tempo data

		return {
			timestampUnit: Utils.decodeTimestampUnit(body[0]),
			tempoData: body.subarray(1)
		};
	}

	/**
	 * Decode an unsynchronised lyrics frame
	 * @param body - The frames body
	 * @returns The decoded frame
	 */
	protected static decodeUnsynchronisedLyricsFrame(body: Buffer): ISpecialTextFrame{
		const encoding = Utils.getEncoding(body[0]);

		const nullByteLength = Utils.getNullByteLength(body[0]);

		const descriptorEnd = nullByteLength === 2 ? Utils.indexOfDoubleZeroByte(body, 4) : body.indexOf(0x00, 4);

		return {
			language: body.subarray(1, 4).toString(encoding),
			description: body.subarray(4, descriptorEnd).toString(encoding),
			value: body.subarray(descriptorEnd + nullByteLength).toString(encoding)
		};
	}

	/**
	 * Decode a synchronised lyrics frame
	 * @param body - The frames body
	 * @returns The decoded frame
	 */
	protected static decodeSynchronisedLyricsFrame(body: Buffer): ISynchronisedLyrics{
		const encoding = Utils.getEncoding(body[0]);
		const nullByteLength = Utils.getNullByteLength(body[0]);

		const descriptionEnd = nullByteLength ? Utils.indexOfDoubleZeroByte(body, 6) : body.indexOf(0x00, 6);

		const contentTypes = {
			"00": "Other",
			"01": "Lyrics",
			"02": "Text transcription",
			"03": "Movement/Part name",
			"04": "Events",
			"05": "Chord",
			"06": "Trivia/popup information",
			"07": "Webpage URLs",
			"08": "Image URLs"
		};

		const syncs = [];

		let offset = descriptionEnd + nullByteLength;

		while(offset < body.length){
			const valueEnd = nullByteLength ? Utils.indexOfDoubleZeroByte(body, offset) : body.indexOf(0x00, offset);

			const valueLength = valueEnd - offset;

			syncs.push({
				value: body.subarray(offset, valueEnd).toString(encoding),
				time: body.readInt32BE(offset + valueLength + nullByteLength)
			});

			offset += (valueEnd - offset) + 5;
		}

		return {
			type: contentTypes[body[5].toString(16)],
			description: body.subarray(6, descriptionEnd).toString(encoding),
			language: body.subarray(1, 4).toString(encoding),
			timestampUnit: Utils.decodeTimestampUnit(body[4]),
			syncs
		};
	}

	protected static decodeRelativeVolumeAdjustmentFrame(body: Buffer): IRelativeVolumeAdjustment {
		
	}
}