import { Buffer } from 'buffer';
import { Frame } from '.';
import { IVersionSupport } from '@encoder/isVersionSupported';
import { TimestampUnit, TimestampUnits } from '@utils';

/**
 * A singular event that is stored within the event timing codes
 */
interface IEvent {
	/**
	 * This is the time at which this particular event occurs in the audio track, the unit that this is (either MPEG frames
	 * or Milliseconds) depends on the value of the timestamp unit that is stored within this frame
	 */
	timeStamp: number;

	/**
	 * This is the type of event that occurs at the given timestamp,
	 * this can be any of a number of events as are described below; (all numbers are in hexadecimal)
	 *
	 * 0x00 - padding (has no meaning)
	 *
	 * 0x01 - end of initial silence
	 *
	 * 0x02 - intro start
	 *
	 * 0x03 - main part start
	 *
	 * 0x04 - outro start
	 *
	 * 0x05 - outro end
	 *
	 * 0x06 - verse start
	 *
	 * 0x07 - refrain start
	 *
	 * 0x08 - interlude start
	 *
	 * 0x09 - theme start
	 *
	 * 0x0A - variation start
	 *
	 * 0x0B - key change
	 *
	 * 0x0C - time change
	 *
	 * 0x0D - momentary unwanted noise (Snap, Crackle & Pop)
	 *
	 * 0x0E - sustained noise
	 *
	 * 0x0F - sustained noise end
	 *
	 * 0x10 - intro end
	 *
	 * 0x11 - main part end
	 *
	 * 0x12 - verse end
	 *
	 * 0x13 - refrain end
	 *
	 * 0x14 - theme end
	 *
	 * 0x15 - profanity
	 *
	 * 0x16 - profanity end
	 *
	 * 0x17 - 0xDF - reserved for future use
	 *
	 * 0xE0 - 0xEF - not predefined synch 0-F
	 *
	 * 0xF0 - 0xFC - reserved for future use
	 *
	 * 0xFD - audio end (start of silence)
	 *
	 * 0xFE - audio file ends
	 */
	event: number;
}

/**
 * The value that is stored in an involved people list frame
 */
interface IEventTimingCodesValue {
	/**
	 * The unit that is used for all of the time codes within the frame
	 */
	timestampUnit: TimestampUnit;

	/**
	 * The particular events that are stored within the frames
	 */
	events: IEvent[];
}

/**
 * Event Timing Codes
 *
 * This frame allows for the synchronisation of events with points within the audio of this file.
 *
 * There may only be one of these frames within a tag
 */
export default class EventTimingCodesFrame extends Frame {
	/**
	 * The value of this text frame
	 */
	public value: IEventTimingCodesValue;

	/**
	 * Decode an event timing codes frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: 2 | 3 | 4);

	/**
	 * Create a new event timing codes frame
	 * @param identifier - The identifier of this frame
	 * @param value - The value of this text information frame
	 */
	public constructor(value: IEventTimingCodesValue);
	public constructor(dataOrValue: IEventTimingCodesValue | Buffer, ID3Version?: 2 | 3 | 4){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, ID3Version as 2 | 3 | 4);

			const timestampUnit = dataOrValue[headerInfo.headerSize] === 1 ? TimestampUnits.MPEGFrames : TimestampUnits.Milliseconds;

			const events: IEvent[] = [];

			for(let i = headerInfo.headerSize + 1; i < dataOrValue.length; i += 5){
				events.push({
					event: dataOrValue[i],
					timeStamp: dataOrValue.readInt32BE(i + 1)
				});
			}

			this.value = {
				timestampUnit,
				events
			};
		} else {
			this.identifier = "ETCO";
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
			Buffer.from(new Uint8Array([ this.value.timestampUnit.byteRepresentation ])),
			Buffer.concat(this.value.events.map(event => {
				const timestampBuffer = Buffer.alloc(4, 0);

				timestampBuffer.writeInt32BE(event.timeStamp, 0);

				return Buffer.concat([
					Buffer.from(new Uint8Array([ event.event ])),
					timestampBuffer
				]);
			}))
		]);
	}

	/**
	 * Test if the content of this frame can be encoded with the specified version
	 * @param version - The version to test
	 * @returns Whether the content can be encoded with the specified version
	 */
	protected contentSupportsVersion(): IVersionSupport{
		return {
			supportsVersion: true,
			reason: ""
		};
	}
}