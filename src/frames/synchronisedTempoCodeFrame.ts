import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';
import { TimestampUnit } from '@utils';

/**
 * A singular tempo code
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
 * The data that is stored in an synchronised tempo codes frame
 */
interface ISynchronisedTempoCodesValue {
	/**
	 * The unit that all of the times are stored in for the tempo codes
	 */
	timestampUnit: TimestampUnit;

	/**
	 * The tempo codes
	 */
	tempoCodes: ITempoCode[];
}

/**
 * A basic text information frame
 */
export default class SynchronisedTempoCodesFrame extends Frame {
	/**
	 * The frame identifier
	 */
	public identifier!: string;

	/**
	 * The value of this frame
	 */
	public value: ISynchronisedTempoCodesValue;

	/**
	 * Decode a synchronised tempo codes frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new synchronised tempo codes frame
	 * @param value - The value of this synchronised tempo codes frame
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