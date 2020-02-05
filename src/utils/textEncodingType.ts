import { Buffer } from "buffer";

/**
 * The pretty names of the different types of encodings
 */
export type TextEncodingName = "ISO-8859-1" | "UTF-16" | "UTF-16BE" | "UTF-8";

/**
 * The internal names of the different types of encodings
 */
type TextEncodingInteralNames = "latin1" | "utf16le" | "utf16be" | "utf8";

/**
 * A type of text encoding
 */
export default class TextEncodingType {
	public readonly terminator: Buffer;
	public readonly byteRepresentation: number;

	private readonly internalName: TextEncodingInteralNames;

	/**
	 * Create a new text encoding type from the byte representation of the encoding type
	 * @param encodingByte - The byte representation of the encoding
	 */
	constructor(encodingByte: number);

	/**
	 * Create a new text encoding type from the name of the encoding type
	 * @param encodingType - The name of the encoding type to use
	 */
	constructor(encodingType: TextEncodingName)
	constructor(encodingType: number | TextEncodingName){
		const encoding = typeof encodingType === "string" ? encodingType : this.getNameFromByte(encodingType);

		this.byteRepresentation = this.getByteFromName(encoding);

		const terminators = {
			single: Buffer.from(new Uint8Array([ 0x00 ])),
			double: Buffer.from(new Uint8Array([ 0x00, 0x00 ]))
		};

		switch(encoding){
			case "ISO-8859-1":
				this.terminator = terminators.single;
				this.internalName = "latin1";

				break;

			case "UTF-16":
				this.terminator = terminators.double;
				this.internalName = "utf16le";

				break;

			case "UTF-16BE":
				this.terminator = terminators.double;
				this.internalName = "utf16be";

				break;

			case "UTF-8":
				this.terminator = terminators.single;
				this.internalName = "utf8";

				break;

			default:
				throw new Error(`Invalid encoding type: ${encoding}`);
		}
	}

	/**
	 * Encode the specified text with this type of text encoding
	 * @param text - The text to encode
	 * @returns A buffer containing the encoded text
	 */
	public encodeText(text: string){
		if(this.internalName === "utf16be"){
			return this.toggleUTF16Endian(Buffer.from(text, "utf16le"));
		}

		return Buffer.from(text, this.internalName);
	}

	/**
	 * Decode text using this type of encoding
	 * @param data - The data to decode
	 * @returns The decoded text
	 */
	public decodeText(data: Buffer){
		if(this.internalName === "utf16be"){
			return this.toggleUTF16Endian(data).toString("utf16le");
		}

		return data.toString(this.internalName);
	}

	/**
	 * Get the name of the encoding from it's byte representation
	 * @param encodingByte - The byte representation
	 * @returns The name of the encoding
	 */
	private getNameFromByte(encodingByte: number): TextEncodingName {
		switch(encodingByte){
			case 0x00:
				return "ISO-8859-1";

			case 0x01:
				return "UTF-16";

			case 0x02:
				return "UTF-16BE";

			case 0x03:
				return "UTF-8";

			default:
				throw new Error(`Invalid text encoding byte: ${encodingByte}`);
		}
	}

	/**
	 * Get the byte representation of the encoding from it's name
	 * @param encodingName - The name of the encoding
	 * @returns The byte representation of the encoding
	 */
	private getByteFromName(encodingName: TextEncodingName){
		switch(encodingName){
			case "ISO-8859-1":
				return 0x00;

			case "UTF-16":
				return 0x01;

			case "UTF-16BE":
				return 0x02;

			case "UTF-8":
				return 0x03;

			default:
				throw new Error(`Invalid text encoding type: ${encodingName}`);
		}
	}

	/**
	 * Toggle a buffer between UTF-16LE and UTF16-BE
	 * @param data - The buffer to toggle
	 * @returns The toggled buffer
	 */
	private toggleUTF16Endian(data: Buffer): Buffer{
		const newBuffer = Buffer.alloc(data.length, 0);

		for(let i = 0; i < data.length; i += 2){
			newBuffer[i] = data[i + 1];
			newBuffer[i + 1] = data[i];
		}

		return newBuffer;
	}
}