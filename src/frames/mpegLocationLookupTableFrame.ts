import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';

/**
 * The deviation of a reference from the milliseconds and bytes that were stated
 */
interface IReferenceDeviation {
	/**
	 * The amount of bytes that this reference deviates by
	 */
	byteDeviation: number;

	/**
	 * The amount of time that this reference deviates by in milliseconds
	 */
	millisecondDeviation: number;
}

/**
 * The data that is stored in an MPEG location lookup table frame
 */
interface IMPEGLocationLookupTableValue {
	/**
	 * The amount of mpeg frames between reference points, for example;
	 * 1 means every frame is a reference point, 2 is every second frame, etc
	 */
	MPEGFramesBetweenReferences: number;

	/**
	 * The amount of bytes between each reference point
	 */
	bytesBetweenReferences: number;

	/**
	 * The amount of time (in milliseconds) between each reference point
	 */
	millisecondsBetweenReferences: number;

	/**
	 * An array of the amount that each reference point deviates from the stated amount between each reference
	 */
	deviationOfReferences: IReferenceDeviation[];
}

/**
 * A basic text information frame
 */
export default class MPEGLocationLookupTableFrame extends Frame {
	/**
	 * The frame identifier
	 */
	public identifier!: string;

	/**
	 * The value of this text frame
	 */
	public value: IMPEGLocationLookupTableValue;

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
	public constructor(value: IMPEGLocationLookupTableValue);

	public constructor(dataOrValue: Buffer | IMPEGLocationLookupTableValue, ID3Version?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, ID3Version as 3 | 4);

			const deviations: IReferenceDeviation[] = [];

			const bitsForByteDeviation = dataOrValue[headerInfo.headerSize + 8];
			const bitsForMillisecondsDeviation = dataOrValue[headerInfo.headerSize + 9];

			const referencesData = dataOrValue.slice(headerInfo.headerSize + 10);

			const referencesString = referencesData.readIntBE(0, referencesData.length).toString(2);

			for(let i = 0; i < referencesString.length; i += bitsForByteDeviation + bitsForMillisecondsDeviation){
				deviations.push({
					byteDeviation: parseInt(referencesString.substr(i, bitsForByteDeviation), 2),
					millisecondDeviation: parseInt(referencesString.substr(i + bitsForByteDeviation, bitsForMillisecondsDeviation), 2)
				});
			}

			this.value = {
				MPEGFramesBetweenReferences: dataOrValue.readInt16BE(headerInfo.headerSize),
				bytesBetweenReferences: dataOrValue.readIntBE(headerInfo.headerSize + 2, 3),
				millisecondsBetweenReferences: dataOrValue.readIntBE(headerInfo.headerSize + 5, 3),
				deviationOfReferences: deviations
			};
		} else {
			this.identifier = "MLLT";

			this.value = dataOrValue;
		}
	}

	/**
	 * Encode the content of the frame
	 * @param encodingOptions - The encoding options to encode with
	 * @returns The encoded content
	 */
	public encodeContent(){
		if(this.value.MPEGFramesBetweenReferences > 65535){
			throw new Error("MPEG frames between references cannot exceed 65,535");
		}

		if(this.value.bytesBetweenReferences > 16777215){
			throw new Error("Bytes between references cannot exceed 16,777,215");
		}

		if(this.value.millisecondsBetweenReferences > 16777215){
			throw new Error("Milliseconds between references cannot exceed 16,777,215");
		}

		//FIXME: this does not work for negative numbers
		const maxByteDeviation = Math.max(...this.value.deviationOfReferences.map(ref => ref.byteDeviation));
		const maxMillisecondDeviation = Math.max(...this.value.deviationOfReferences.map(ref => ref.millisecondDeviation));

		const bytesForByteDeviation = Math.ceil(Math.log2(maxByteDeviation + 1) / 8);
		const bytesForMillisecondDeviation = Math.ceil(Math.log2(maxMillisecondDeviation + 1) / 8);

		if(bytesForByteDeviation * 8 > 255){
			throw new Error("Byte deviation cannot exceed 2^255");
		}

		if(bytesForMillisecondDeviation * 8 > 255){
			throw new Error("Millisecond deviation cannot exceed 2^255");
		}

		// tslint:disable-next-line: binary-expression-operand-order
		const retBuffer = Buffer.alloc(10, 0);

		retBuffer.writeInt16BE(this.value.MPEGFramesBetweenReferences, 0);		//Mpeg frames between references
		retBuffer.writeIntBE(this.value.bytesBetweenReferences, 2, 3);			//Bytes between references
		retBuffer.writeIntBE(this.value.millisecondsBetweenReferences, 2, 5);	//Milliseconds between referencess
		retBuffer[8] = bytesForByteDeviation * 8;								//Bytes for byte deviations
		retBuffer[9] = bytesForMillisecondDeviation * 8;						//Bytes for millsecond deviations

		return Buffer.concat([
			retBuffer,
			Buffer.concat(this.value.deviationOfReferences.map(ref => {
				const referenceBuffer = Buffer.alloc(bytesForByteDeviation + bytesForMillisecondDeviation, 0);

				referenceBuffer.writeIntBE(ref.byteDeviation, 0, bytesForByteDeviation);
				referenceBuffer.writeIntBE(ref.byteDeviation, bytesForByteDeviation, bytesForMillisecondDeviation);

				return referenceBuffer;
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