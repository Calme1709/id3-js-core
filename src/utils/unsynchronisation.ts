import { Buffer } from 'buffer';

/**
 * A class that handles the logic of unsynchronisation
 */
export default class Unsynchronisation {
	/**
	 * Unsynchronise the passed data
	 * @param data - The data to unsynchronisation
	 * @returns The encoded data
	 */
	public static encode(data: Buffer){
		//FIXME: this is horribly inefficient, find a better way to do this
		const encodedBytes: number[] = [];

		for(let i = 0; i < data.length; i++){
			encodedBytes.push(data[i]);

			if(data[i] === 0xFF){
				if(data[i + 1] === 0x00 || data[i + 1] >= 0xE0 || i === data.length - 1){
					encodedBytes.push(0x00);
				}
			}
		}

		return Buffer.from(new Uint8Array(encodedBytes));
	}

	/**
	 * Remove the unsynchronisation from a passed buffer
	 * @param data - The data to remove the unsynchronisation from
	 * @returns The decoded data
	 */
	public static decode(data: Buffer){
		//FIXME: this is horribly inefficient, find a better way to do this
		const decodedBytes: number[] = [];

		for(let i = 0; i < data.length; i++){
			decodedBytes.push(data[i]);

			if(data[i] === 0xFF){
				i += 1;
			}
		}

		return Buffer.from(new Uint8Array(decodedBytes));
	}
}