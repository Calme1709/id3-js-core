import { Buffer } from "buffer";
import { IEncodingOptions } from '../../encodingOptions';
import { IV3FrameFlags, IV4FrameFlags } from '../../types';
import Utils from '../../utils';
import FrameFlagManager from './frameFlagManager';

/**
 * The base class that all frames derive from
 */
export default abstract class Frame {
	public get supportedVersions(){
		return this.flagManager.supportedVersions.filter(version => this.contentSupportedVersions.includes(version));
	}

	public abstract identifier: string;
	public abstract frameType: string;
	// tslint:disable-next-line: no-any
	public abstract value: any;

	protected abstract contentSupportedVersions: number[];

	private readonly flagManager = new FrameFlagManager();

	set flags(flags: IV3FrameFlags | IV4FrameFlags | undefined){
		this.flagManager.setFlags(flags);
	}

	get flags(){
		return this.flagManager.flags;
	}

	/**
	 * Encode the frame into a buffer
	 * @param ID3Version - The version to encode for
	 * @returns The encoded frame
	 */
	public abstract encodeContent(encodingOptions: IEncodingOptions): Buffer;

	/**
	 * Encode the frame
	 * @param encodingOptions - The options used to encode this frame
	 * @returns The encoded frame
	 */
	public encode(encodingOptions: IEncodingOptions){
		const contentBuffer = this.encodeContent(encodingOptions);

		const identifier = Utils.getCorrectIdentifier(this.identifier, encodingOptions.ID3Version);

		if(encodingOptions.ID3Version === 2){
			const headerBuffer = Buffer.alloc(6, 0);

			headerBuffer.write(Utils.getCorrectIdentifier(this.identifier, 2), 0, 3, "latin1");
			headerBuffer.writeUIntBE(Utils.encodeSynchsafeInteger(contentBuffer.length), 3, 3);

			return Buffer.concat([
				headerBuffer,
				contentBuffer
			]);
		} else {
			const headerBuffer = Buffer.alloc(8, 0);
			headerBuffer.write(Utils.getCorrectIdentifier(this.identifier, 3));
			headerBuffer.writeUInt32BE(Utils.encodeSynchsafeInteger(contentBuffer.length), 4);

			if(this.flagManager.flags === undefined){
				this.flagManager.setDefaultFlags(identifier, encodingOptions.ID3Version);
			}

			return Buffer.concat([
				headerBuffer,
				this.flagManager.encode(encodingOptions),
				contentBuffer
			]);
		}
	}

	/**
	 * Get a string representation of the frame
	 * @returns The string representation of the frame
	 */
	public toString(){
		return `${this.identifier}: ${JSON.stringify(this.value)}`;
	}
}