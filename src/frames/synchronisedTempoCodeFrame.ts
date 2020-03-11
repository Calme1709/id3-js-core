import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';
import { TimestampUnit } from '@utils';

/**
 * A singular synchronised tempo code
 */
interface ITempoCode {
	/**
	 * The time that this tempo code relates to
	 */
	time: number;

	/**
	 * The tempo that occurs at the time specified
	 */
	tempo: number;
}

/**
 * The value that is stored in a Synchronised Tempo Codes frame
 */
interface ISynchronisedTempoCodesValue {
	/**
	 * The unit that all of the times are stored in for the tempo codes
	 */
	timestampUnit: TimestampUnit;

	/**
	 * The collection of tempo codes that are stored in the frame
	 */
	tempoCodes: ITempoCode[];
}

/**
 * Synchronised Tempo Codes
 *
 * This frame is used to give a more accurate description of the tempo of the audio that is stored in this file.
 *
 * There may only be one of this frame in a tag.
 */
export default class SynchronisedTempoCodesFrame extends Frame {
	/**
	 * The value of this frame
	 */
	public value: ISynchronisedTempoCodesValue;

	/**
	 * Decode a Synchronised Tempo Codes frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new Synchronised Tempo Codes frame
	 * @param value - The value of this Synchronised Tempo Codes frame
	 */
	public constructor(value: ISynchronisedTempoCodesValue);
	public constructor(dataOrValue: Buffer | ISynchronisedTempoCodesValue, ID3Version?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, ID3Version as 3 | 4);

			const tempoCodes: ITempoCode[] = [];

			const timestampUnit = new TimestampUnit(dataOrValue[headerInfo.headerSize]);

			for(let i = headerInfo.headerSize + 1; i < dataOrValue.length; i += 5){
				let tempo = dataOrValue[i];

				if(tempo === 0xFF){
					tempo += dataOrValue[i + 1];

					i += 1;
				}

				tempoCodes.push({
					tempo,
					time: dataOrValue.readInt32BE(i + 1)
				});
			}

			this.value = {
				timestampUnit,
				tempoCodes
			};
		} else {
			this.identifier = "MLLT";

			this.value = dataOrValue;
		}
	}

	/**
	 * Encode the content of the frame
	 * @returns The encoded content
	 */
	public encodeContent(){
		return Buffer.concat([
			Buffer.from(new Uint8Array([ this.value.timestampUnit.byteRepresentation ])),
			Buffer.concat(this.value.tempoCodes.map(tempoCode => {
				const tempoDescriptor = Buffer.from(new Uint8Array(
					tempoCode.tempo > 0xFF ?
						[ 0xFF, tempoCode.tempo - 0xFF ] :
						[ tempoCode.tempo ]
				));

				const timestampBuffer = Buffer.alloc(4, 0);
				timestampBuffer.writeInt32BE(tempoCode.time, 0);

				return Buffer.concat([
					tempoDescriptor,
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