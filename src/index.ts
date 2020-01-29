import Decoder from "./decoder";

import { Buffer } from "buffer";
export default class ID3JS {
	public static write(){

	}

	public static read(data: Buffer){
		return Decoder.decode(data);
	}

	public static remove(){

	}

	public static update(){

	}
}