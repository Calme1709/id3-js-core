import Encoder from "@encoder";
import Decoder from "@decoder";

import { Buffer } from "buffer";
import { Frame } from "@frames";
import { IUserDefinedEncodingOptions } from '@encoder/encodingOptions';

export * from "./frames";

export default class ID3JS {
	public static write(data: Buffer, frames: Frame[], encodingOptions?: IUserDefinedEncodingOptions){
		return Buffer.concat([
			Encoder(frames, encodingOptions || {}),
			data
		]);
	}

	public static read(data: Buffer){
		return Decoder.decode(data);
	}

	public static remove(){

	}

	public static update(){

	}
}