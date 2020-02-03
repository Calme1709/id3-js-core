import { Frame } from "../frames";
import { IUserDefinedEncodingOptions } from './encodingOptions';

/**
 * Data surrounding the support of a version for a specific component of the tag
 */
export interface IVersionSupport{
	/**
	 * Whether the version is supported
	 */
	supportsVersion: boolean;

	/**
	 * If the version is supported this will be an empty string otherwise
	 * it will be the reason that this component is not supported
	 */
	reason: string;
}

/**
 * Test if a specified version can be used to encode the data that is specified in the form of
 * the passed frames and encoding options
 * @param version - The version to test
 * @param frames = The frames to test
 * @param encodingOptions = The options to test
 * @returns Whether the data can be encoded using the passed version
 */
export default (version: 2 | 3 | 4, frames: Frame[], encodingOptions: IUserDefinedEncodingOptions) => {
	const reasonsForVersionNotSupported: string[] = [];

	for(const frame of frames){
		const versionSupport = frame.supportsVersion(version);

		if(!versionSupport.supportsVersion){
			reasonsForVersionNotSupported.push(`Frame of type ${frame.frameType} cannot be encoded using ID3v2.${version}: ${versionSupport.reason}`);
		}
	}

	switch(version){
		case 2:
			if(encodingOptions.textEncoding?.substr(0, 5) === "utf16"){
				reasonsForVersionNotSupported.push(`ID3v2.2 does not support text encoding of type ${encodingOptions.textEncoding}`);
			}

			if(encodingOptions.experimental){
				reasonsForVersionNotSupported.push("ID3v2.2 does not support tags being marked as experimental");
			}

			if(encodingOptions.tagIsAnUpdate){
				reasonsForVersionNotSupported.push("ID3v2.2 does not support tags being marked as updates");
			}

			if(encodingOptions.crcData !== undefined){
				reasonsForVersionNotSupported.push(`ID3v2.2 does not support the inclusion of CRC data`);
			}

			if(encodingOptions.tagRestrictions){
				reasonsForVersionNotSupported.push("ID3v2.2 does not support the inclusion of tag encoding restrictions");
			}

			break;

		case 3:
			if(encodingOptions.textEncoding?.substr(0, 5) === "utf16"){
				reasonsForVersionNotSupported.push(`ID3v2.3 does not support text encoding of type ${encodingOptions.textEncoding}`);
			}

			if(encodingOptions.tagIsAnUpdate){
				reasonsForVersionNotSupported.push("ID3v2.3 does not support tags being marked as updates");
			}

			if(encodingOptions.tagRestrictions){
				reasonsForVersionNotSupported.push("ID3v2.2 does not support the inclusion of tag encoding restrictions");
			}

			break;

		case 4:
			break;

		default:
			throw new Error(`Invalid ID3 version: ${version}`);
	}

	return reasonsForVersionNotSupported.length === 0 ? {
		supported: true,
		reasons: []
	} : {
		supported: false,
		reasons: reasonsForVersionNotSupported
	};
};