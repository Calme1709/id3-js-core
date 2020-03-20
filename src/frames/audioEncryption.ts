import { Buffer } from 'buffer';
import Frame from './frameComponents/frame';
import { IVersionSupport } from '@encoder/isVersionSupported';
import { bufferFromNumbers } from '@utils';

/**
 * The information that is stored in an audio encryption frame
 */
interface IAudioEncryptionValue {
	/**
	 * This is a string with a URL containing an email address, or a link to a location where an email address can be found,
	 * that belongs to the organisation responsible for this specific encrypted audio file.
	 */
	ownerIdentifier: string;

	/**
	 * If there is a part of the audio that is unencrypted, this will point to the start of the unecrypted "preview", this is in
	 * frames. If there is no preview this will be equal to zero.
	 */
	previewStart: number;

	/**
	 * If there is a part of the audio that is unencrypted, this will be the length of the unecrypted "preview", this is in
	 * frames. If there is no preview this will be equal to zero.
	 */
	previewLength: number;

	/**
	 * This is an optional data block required for decryption of the audio, what data this stores will differ depending on the
	 * type of encryption that this frame is describing
	 */
	encryptionInfo?: Buffer;
}

/**
 * Audio Encryption
 *
 * This frame indicates if the actual audio stream is encrypted, and by whom. Since standardization of such encryption scheme
 * is beyond this document, all “CRA” frames begin with a terminated string with a URL containing an email address, or a link
 * to a location where an email address can be found, that belongs to the organisation responsible for this specific
 * encrypted audio file.
 *
 * There may be more than one of this frame in a tag, but only one with the same ‘ownerIdentifier’.
 */
export default class AudioEncryptionFrame extends Frame<IAudioEncryptionValue> {
	/**
	 * Decode an audio encryption frame from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new audio encryption frame
	 * @param value - The value of this audio encryption frame
	 */
	public constructor(value: IAudioEncryptionValue);
	public constructor(dataOrValue: Buffer | IAudioEncryptionValue, ID3Version?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, ID3Version as 3 | 4);

			const frameContent = dataOrValue.slice(headerInfo.headerSize);

			const ownerIdentifierTerminatorIndex = frameContent.indexOf(0x00);

			this.value = {
				ownerIdentifier: frameContent.slice(0, ownerIdentifierTerminatorIndex).toString("latin1"),
				previewStart: frameContent.readUInt16BE(ownerIdentifierTerminatorIndex + 1),
				previewLength: frameContent.readUInt16BE(ownerIdentifierTerminatorIndex + 3),
				encryptionInfo: frameContent.length > ownerIdentifierTerminatorIndex + 5 ?
					frameContent.slice(ownerIdentifierTerminatorIndex + 5) :
					undefined
			};
		} else {
			this.identifier = "AENC";

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
			Buffer.from(this.value.ownerIdentifier),
			bufferFromNumbers([ 0 ], 1),
			bufferFromNumbers([
				this.value.previewStart,
				this.value.previewLength
			], 2),
			this.value.encryptionInfo || Buffer.alloc(0)
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