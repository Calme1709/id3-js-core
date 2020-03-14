import { Buffer } from 'buffer';
import { IEncodingOptions } from './encodingOptions';
import { SynchsafeInteger, FlagByte, Unsynchronisation, bufferFromNumbers } from '@utils';

/**
 * A class which handles all of the logic for encoding a tag header
 */
export default class TagHeaderEncoder {
	/**
	 * Generate a tag header from the passed data
	 * @param tagSize - The size of the tag
	 * @param encodingOptions - The options used to encode this tag
	 * @returns The encoded tag
	 */
	public static encode(tagSize: number, encodingOptions: IEncodingOptions){
		const extendedHeaderGenerators = {
			3: this.generateExtendedHeaderV3.bind(this),
			4: this.generateExtendedHeaderV4.bind(this)
		};

		const extendedHeaderBuffer = this.requiresExtendedHeader(encodingOptions) ?
			extendedHeaderGenerators[encodingOptions.ID3Version as 3 | 4](encodingOptions) :
			Buffer.alloc(0);

		const sizeBuffer = Buffer.alloc(4, 0);
		sizeBuffer.writeInt32BE(SynchsafeInteger.encode(tagSize + extendedHeaderBuffer.length), 0);

		return Buffer.concat([
			Buffer.from("ID3", "latin1"),				//The ID3 tag identifier
			Buffer.from(new Uint8Array([
				encodingOptions.ID3Version, 			//Major revision of the ID3v2 spec
				0x00,									//Minor revision of the ID3v2 spec, always zero
				this.generateFlagByte(encodingOptions)	//The flag byte
			])),
			sizeBuffer,									//The size
			extendedHeaderBuffer
		]);
	}

	/**
	 * Generate the extended header buffer for ID3v2.3
	 * @param encodingOptions - The options which this tag will be encoded with, this contains all of the information that is
	 * required to create the extended header.
	 * @returns The buffer containing the extended header
	 */
	private static generateExtendedHeaderV3(encodingOptions: IEncodingOptions){
		const extendedHeaderBuffer = Buffer.alloc(10, 0);

		extendedHeaderBuffer.writeInt32BE(10, 0);									//The size of the extended header
		extendedHeaderBuffer.writeInt16BE(32768, 4);								//Extended flags byte (crc data included)
		extendedHeaderBuffer.writeInt32BE(0, 6);									//Padding size
		extendedHeaderBuffer.writeInt32BE(encodingOptions.crcData as number, 10);	//The CRC data

		return encodingOptions.unsynchronisation ? Unsynchronisation.encode(extendedHeaderBuffer) : extendedHeaderBuffer;
	}

	/**
	 * Generate the extended header buffer for ID3v2.4
	 * @param encodingOptions - The options which this tag will be encoded with, this contains all of the information that is
	 * required to create the extended header.
	 * @returns The buffer containing the extended header
	 */
	private static generateExtendedHeaderV4(encodingOptions: IEncodingOptions){
		const flagByte = FlagByte.encode([
			false,
			encodingOptions.tagIsAnUpdate,
			encodingOptions.crcData !== undefined,
			encodingOptions.tagRestrictions !== undefined
		]);

		const buffers: Buffer[] = [];

		buffers.push(bufferFromNumbers([ 0x01, flagByte ]));

		if(encodingOptions.tagIsAnUpdate){
			buffers.push(bufferFromNumbers([ 0x00 ]));
		}

		if(encodingOptions.crcData !== undefined){
			const crcDataBuffer = Buffer.alloc(6, 0);

			crcDataBuffer[0] = 0x05;

			crcDataBuffer.writeIntBE(SynchsafeInteger.encode(encodingOptions.crcData), 1, 5);

			buffers.push(crcDataBuffer);
		}

		if(encodingOptions.tagRestrictions !== undefined){
			const {
				tagSize = 0,
				textEncoding = 0,
				textFieldSize = 0,
				imageEncoding = 0,
				imageSize = 0
			} = encodingOptions.tagRestrictions;

			buffers.push(Buffer.from(new Uint8Array([
				0x01,
				parseInt([ tagSize, textEncoding, textFieldSize, imageEncoding, imageSize ].reduce((acc, cur, i) =>
					acc + (i % 2 === 1 ? cur.toString(2) : cur.toString(2).padStart(2, "0"))
				, ""), 2)
			])));
		}

		const sizeBuffer = Buffer.alloc(4, 0);
		const extendedHeaderExcludingSize = Buffer.concat(buffers);

		sizeBuffer.writeInt32BE(extendedHeaderExcludingSize.length, 0);

		const extendedHeaderBuffer = Buffer.concat([ sizeBuffer, extendedHeaderExcludingSize ]);

		return encodingOptions.unsynchronisation ? Unsynchronisation.encode(extendedHeaderBuffer) : extendedHeaderBuffer;
	}

	/**
	 * Generate the header flag byte
	 * @param encodingOptions - The options which this tag will be encoded with, this contains all of the information that is
	 * required to generate the flag byte.
	 * @returns - The flag byte
	 */
	private static generateFlagByte(encodingOptions: IEncodingOptions){
		switch(encodingOptions.ID3Version){
			case 2:
				return FlagByte.encode([
					encodingOptions.unsynchronisation
				]);

			case 3:
				return FlagByte.encode([
					encodingOptions.unsynchronisation,
					this.requiresExtendedHeader(encodingOptions),
					encodingOptions.experimental
				]);

			case 4:
				return FlagByte.encode([
					encodingOptions.unsynchronisation,
					this.requiresExtendedHeader(encodingOptions),
					encodingOptions.experimental
				]);

			default:
				throw new Error(`Invalid ID3v2 version: ${encodingOptions.ID3Version}`);
		}
	}

	/**
	 * Test if the options specified require an extended header to be included in the tag
	 * @param encodingOptions - The options that this tag is being encoded with
	 * @returns Whether or not an extended header is required
	 */
	private static requiresExtendedHeader(encodingOptions: IEncodingOptions){
		switch(encodingOptions.ID3Version){
			case 2:
				return false;

			case 3:
				return encodingOptions.crcData !== undefined;

			case 4:
				return (
					encodingOptions.tagIsAnUpdate ||
					encodingOptions.crcData !== undefined ||
					encodingOptions.tagRestrictions !== undefined
				);

			default:
				throw new Error(`Invalid ID3v2 version: ${encodingOptions.ID3Version}`);
		}
	}
}