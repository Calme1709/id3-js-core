import { Frame } from '@frames';
import { IUserDefinedEncodingOptions, IEncodingOptions, IDefaultEncodingOptions } from './encodingOptions';
import { Buffer } from 'buffer';
import isVersionSupported from './isVersionSupported';
import { defaultEncodingOptions } from "@data";
import { TextEncodingType } from '@utils';

export default (frames: Frame[], encodingOptions: IUserDefinedEncodingOptions) => {
	if(encodingOptions.ID3Version && !isVersionSupported(encodingOptions.ID3Version, frames, encodingOptions)){
		throw new Error(`Cannot encode using ID3v2.${encodingOptions.ID3Version}`);
	}

	const reasonsForVersionNotSupported: {[key: number]: string[]} = {
		2: [],
		3: [],
		4: []
	};

	const encodingVersion = encodingOptions.ID3Version || [ 4, 3, 2 ].find(version => {
		const versionSupport = isVersionSupported(version as 2 | 3 | 4, frames, encodingOptions);

		if(!versionSupport.supported){
			reasonsForVersionNotSupported[version] = versionSupport.reasons;
		}

		return versionSupport.supported;
	});

	if(encodingVersion === undefined){
		throw new Error(
			`For all versions of the ID3v2 spec there is atleast one component of the data that cannot be encoded;\n
			\tID3v2.2:\n${reasonsForVersionNotSupported[2].map(reason => `\t\t${reason}\n`)}\n
			\tID3v2.3:\n${reasonsForVersionNotSupported[3].map(reason => `\t\t${reason}\n`)}\n
			\tID3v2.4:\n${reasonsForVersionNotSupported[4].map(reason => `\t\t${reason}\n`)}\n`
		);
	}

	const defaultOptions = (defaultEncodingOptions as {[key: string]: IDefaultEncodingOptions})[encodingVersion.toString()];

	const textEncoding = new TextEncodingType(
		encodingOptions.textEncoding !== undefined ?
			encodingOptions.textEncoding :
			defaultOptions.textEncoding
	);

	const computedEncodingOptions: IEncodingOptions = {
		...defaultOptions,
		...encodingOptions,
		ID3Version: encodingVersion as 2 | 3 | 4,
		textEncoding
	};

	const encodedFrames: Buffer[] = [];

	for(const frame of frames){
		encodedFrames.push(frame.encode(computedEncodingOptions));
	}

	return Buffer.concat(encodedFrames);
};