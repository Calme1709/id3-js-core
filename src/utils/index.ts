export { default as TextEncodingType, TextEncodingName } from "./textEncodingType";
export { default as SynchsafeInteger } from "./synchsafeIntegers";
export { default as TimestampUnit, TimestampUnits } from "./timestampUnit";
export { default as FlagByte } from "./flagByte";
export { default as Unsynchronisation } from "./unsynchronisation";
export { default as bufferFromNumbers } from "./bufferFromNumbers";

import { remappedFrames } from "../data.json";

/**
 * Find the length of the frame identifier for the specified version of the ID3 spec
 * @param ID3Version - The version of the ID3 spec to find the identifier length for
 * @returns The length of the identifier in the described ID3v2 spec
 */
export const getIdentifierLength = (ID3Version: number) => {
	return ID3Version > 2 ? 4 : 3;
};

/**
 * Remap an identifier from it's 3 character version (ID3v2.2) to it's 4 character version (ID3v2.3+) or vice versa
 * @param identifier - The identifier to remap
 * @param targetID3Version - The target version to remap the identifier to
 * @returns The remapped identifier
 */
export const getCorrectIdentifier = (identifier: string, targetID3Version: 2 | 3 | 4) => {
	const originalID3Version = identifier.length === 3 ? 2 : 3;

	if(originalID3Version === 3 && targetID3Version === 4 || originalID3Version === targetID3Version){
		return identifier;
	}

	const positionInRemapArray = originalID3Version > 2 ? 1 : 0;

	for(const remap of remappedFrames){
		if(remap[positionInRemapArray] === identifier){
			return remap[positionInRemapArray === 0 ? 1 : 0];
		}
	}

	throw new Error(`Cannot remap the identifier (${identifier} from version ${originalID3Version} to version ${targetID3Version})`);
};