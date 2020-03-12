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
			reasonsForVersionNotSupported.push(`Frame of type '${frame.constructor.name}' cannot be encoded using ID3v2.${version}: ${versionSupport.reason}`);
		}
	}

	const v4TextEncodings = [ "UTF-8", "UTF-16BE" ];

	if(version !== 4){
		if(v4TextEncodings.includes(encodingOptions.textEncoding || "")){
			reasonsForVersionNotSupported.push(`ID3v2.${version} does not support text encoding of type ${encodingOptions.textEncoding}`);
		}

		if(encodingOptions.tagIsAnUpdate){
			reasonsForVersionNotSupported.push(`ID3v2.${version} does not support tags being marked as updates`);
		}

		if(encodingOptions.tagRestrictions){
			reasonsForVersionNotSupported.push(`ID3v2.${version} does not support the inclusion of tag encoding restrictions`);
		}
	}

	if(version === 2){
		if(encodingOptions.experimental){
			reasonsForVersionNotSupported.push("ID3v2.2 does not support tags being marked as experimental");
		}

		if(encodingOptions.crcData !== undefined){
			reasonsForVersionNotSupported.push(`ID3v2.2 does not support the inclusion of CRC data`);
		}
	}

	return reasonsForVersionNotSupported.length === 0 ? {
		supported: true,
		reasons: []
	} : {
		supported: false,
		reasons: reasonsForVersionNotSupported
	};
};