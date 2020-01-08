import { Buffer as buffer } from "buffer";
import { readFileSync, writeFileSync } from 'fs';

/**
 * Flip an objects key and value so that the value becomes the key and vice versa
 * @param obj - The object to flip
 * @returns The flipped object
 */
export const flipObject = <keyType extends string, valueType extends string>(obj: {[key in keyType]: valueType}) => {
	return Object.fromEntries(Object.entries(obj).map(([ key, value ]) => [ value, key ])) as {[key in valueType]: keyType};
};

export const printBuffer = (buffer: Buffer) => {
	console.log(buffer.toString("hex").match(/../g)?.join(" "));
};

/**
 * Decode a size property from an ID3 tag
 * @param sizeBuffer - The buffer containing the 4 bytes of the size
 * @returns The decoded size
 */
export const decodeSize = (sizeBuffer: Buffer) => {
	// tslint:disable-next-line: no-bitwise
	return (sizeBuffer[0] << 21) + (sizeBuffer[1] << 14) + (sizeBuffer[2] << 7) + (sizeBuffer[3]);
};

/**
 * Convert a number from one base to another
 * @param value - The string value of the number
 * @param from - The base it is currently in
 * @param to - The target base
 * @returns The number as a string in it's correct base
 */
export const changeBase = (value: string, from: number, to: number) => {
	return parseInt(value, from).toString(to);
};

/**
 * Read a file
 * @param path - The file of the path to read
 * @returns The contents of the file in buffer form 
 */
export const readFile = async (path: string) => {
	if(typeof navigator != 'undefined' && navigator.product == 'ReactNative'){
		const RNFS = require("react-native-fs");

		const data = await RNFS.readFile(path);

		return new buffer(data, "base64");
	}

	return readFileSync(path);
};

export const writeFile = async (path: string, contents: Buffer) => {
	if(typeof navigator != 'undefined' && navigator.product == 'ReactNative'){
		const RNFS = require("react-native-fs");

		await RNFS.writeFile(path, contents.toString("base64"));

		return;
	}

	return writeFileSync(path, contents, "binary");
}