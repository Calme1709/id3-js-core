import { Buffer } from 'buffer';
import { IEncodingOptions } from './encodingOptions';
import { SynchsafeInteger, FlagByte } from "@utils";

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
		const extendedHeaderBuffer = this.requiresExtendedHeader(encodingOptions) ?
			this.generateExtendedHeader(encodingOptions) :
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
	 * Generate the extended header buffer
	 * @param encodingOptions - The options which this tag will be encoded with, this contains all of the information that is
	 * required to create the extended header.
	 * @returns The buffer containing the extended header
	 */
	private static generateExtendedHeader(encodingOptions: IEncodingOptions){
		switch(encodingOptions.ID3Version){
			case 3: {
				const extendedHeaderBuffer = Buffer.alloc(10, 0);

				extendedHeaderBuffer.writeInt32BE(10, 0);									//The size of the extended header
				extendedHeaderBuffer.writeInt16BE(32768, 4);								//Extended flags byte (crc data included)
				extendedHeaderBuffer.writeInt32BE(0, 6);									//Padding size
				extendedHeaderBuffer.writeInt32BE(encodingOptions.crcData as number, 10);	//The CRC data

				return extendedHeaderBuffer;
			}

			case 4: {
				const flagByte = `
					0
					${encodingOptions.tagIsAnUpdate ? 1 : 0}
					${encodingOptions.crcData !== undefined ? 1 : 0}
					${encodingOptions.tagRestrictions !== undefined ? 1 : 0}
					${"0".repeat(4)}
				`.replace(/\n/g, "").replace(/\t/g, "");

				const buffers: Buffer[] = [];

				buffers.push(Buffer.from(new Uint8Array([
					0x01,
					parseInt(flagByte, 2)
				])));

				if(encodingOptions.tagIsAnUpdate){
					buffers.push(Buffer.from(new Uint8Array([ 0x00 ])));
				}

				if(encodingOptions.crcData !== undefined){
					const crcDataBuffer = Buffer.alloc(6, 0);

					crcDataBuffer[0] = 0x05;

					console.log(SynchsafeInteger.encode(encodingOptions.crcData));
					console.log(SynchsafeInteger.decode(SynchsafeInteger.encode(encodingOptions.crcData)));

					crcDataBuffer.writeIntBE(SynchsafeInteger.encode(encodingOptions.crcData), 1, 5);

					buffers.push(crcDataBuffer);
				}

				if(encodingOptions.tagRestrictions !== undefined){
					let dataByte = "";

					dataByte += encodingOptions.tagRestrictions.tagSize.toString(2).padStart(2, "0");
					dataByte += encodingOptions.tagRestrictions.textEncoding.toString(2);
					dataByte += encodingOptions.tagRestrictions.textFieldSize.toString(2).padStart(2, "0");
					dataByte += encodingOptions.tagRestrictions.imageEncoding.toString(2);
					dataByte += encodingOptions.tagRestrictions.imageSize.toString(2).padStart(2, "0");

					buffers.push(Buffer.from(new Uint8Array([
						0x01,
						parseInt(dataByte, 2)
					])));
				}

				const sizeBuffer = Buffer.alloc(4, 0);
				const extendedHeaderExcludingSize = Buffer.concat(buffers);

				sizeBuffer.writeInt32BE(extendedHeaderExcludingSize.length, 0);

				return Buffer.concat([
					sizeBuffer,
					extendedHeaderExcludingSize
				]);

				break;
			}

			default:
				throw new Error(`Cannot create an extended header for ID3v2.${encodingOptions.ID3Version}`);
		}
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

				break;

			case 3:
				return FlagByte.encode([
					encodingOptions.unsynchronisation,
					this.requiresExtendedHeader(encodingOptions),
					encodingOptions.experimental
				]);

				break;

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