import { Buffer } from 'buffer';
import { Frame } from '.';
import { IEncodingOptions } from "@encoder/encodingOptions";
import { IVersionSupport } from '@encoder/isVersionSupported';
import { TextEncodingType } from '@utils';

/**
 * The value that is stored in an involved people list frame
 */
type InvolvedPeopleListValue = Array<{
	role: string;
	name: string;
}>;

/**
 * An involed people list frame
 */
export default class InvolvedPeopleListFrame extends Frame {
	/**
	 * The type of frame
	 */
	public frameType = "INVOLVEDPEOPLELIST";

	/**
	 * The frame identifier
	 */
	public identifier!: string;

	/**
	 * The value of this frame
	 */
	public value: InvolvedPeopleListValue;

	/**
	 * Decode a involved people list from a buffer
	 * @param data - The data to decode
	 * @param ID3Version - The version of the ID3v2 spec that the tag that this data is from is based on
	 */
	public constructor(data: Buffer, ID3Version: number);

	/**
	 * Create a new involved people list frame
	 * @param involvedPeople - The people that were involved in the making of this audio
	 */
	public constructor(involvedPeople: InvolvedPeopleListValue);
	public constructor(dataOrValue: InvolvedPeopleListValue | Buffer, valueOrID3Version?: number){
		super();

		if(dataOrValue instanceof Buffer){
			const headerInfo = this.decodeHeader(dataOrValue, valueOrID3Version as 3 | 4);

			const encoding = new TextEncodingType(dataOrValue[headerInfo.headerSize]);

			let index = headerInfo.headerSize + 1;

			const involvedPeople: InvolvedPeopleListValue = [];

			while(index < dataOrValue.length - 1){
				const splitPoint = dataOrValue.indexOf(encoding.terminator, index);

				const endPoint = dataOrValue.indexOf(encoding.terminator, splitPoint + 1);

				involvedPeople.push({
					role: encoding.decodeText(dataOrValue.slice(index, splitPoint)),
					name: encoding.decodeText(dataOrValue.slice(splitPoint + encoding.terminator.length, endPoint))
				});

				index += endPoint + encoding.terminator.length;
			}

			this.value = involvedPeople;
		} else {
			this.identifier = "IPLS";

			this.value = dataOrValue;
		}
	}

	/**
	 * Encode the content of the frame
	 * @param encodingOptions - The encoding options to encode with
	 * @returns The encoded content
	 */
	public encodeContent(encodingOptions: IEncodingOptions){
		return Buffer.concat([
			Buffer.from(new Uint8Array([
				encodingOptions.textEncoding.byteRepresentation
			])),
			...this.value.map(involvedPerson =>
				Buffer.concat([
					encodingOptions.textEncoding.encodeText(involvedPerson.role),
					encodingOptions.textEncoding.terminator,
					encodingOptions.textEncoding.encodeText(involvedPerson.name),
					encodingOptions.textEncoding.terminator
				]))
			]
		);
	}

	/**
	 * Test if the content of this frame can be encoded with the specified version
	 * @param version - The version to test
	 * @returns Whether the content can be encoded with the specified version
	 */
	protected contentSupportsVersion(version: number): IVersionSupport{
		if(version === 4){
			return {
				supportsVersion: false,
				reason: "Involed people list frame is not supported in ID3v2.4"
			};
		}

		return {
			supportsVersion: true,
			reason: ""
		};
	}
}