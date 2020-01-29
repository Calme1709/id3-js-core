import Frame from './frames/frameComponents/frame';
import { IUserDefinedEncodingOptions, IEncodingOptions } from './encodingOptions';
import { Buffer } from "buffer";
export default (frames: Frame[], encodingOptions: IUserDefinedEncodingOptions) => {
	const computedEncodingOptions: IEncodingOptions = {
		ID3Version: 4,
		textEncoding: "utf8",
		...encodingOptions
	};

	//Ensure all frames are valid in encodingOptions.ID3Version or calculate a valid version

	const encodedFrames: Buffer[] = [];

	for(const frame of frames){
		encodedFrames.push(frame.encode(computedEncodingOptions));
	}
};