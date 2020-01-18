/**
 * All the supported text encoding methods
 */
export type TextEncoding = "UTF-8" | "UTF-16" | "UTF-16BE" | "latin1";

/**
 * Options for encoding the tag
 */
export interface IEncodingOptions{
	ID3Version: 2 | 3 | 4;
	textEncoding: TextEncoding;
}

/**
 * Options regarding the encoding of the ID3v2 tag
 */
export interface IUserDefinedEncodingOptions {
	/**
	 * Which ID3v2 spec version to adhere to when encoding
	 *
	 * This will default to the highest version that is possible with the frames that are supplied.
	 *
	 * If this version is not valid with the frames that are supplied an error will be thrown
	 */
	ID3Version?: 2 | 3 | 4;

	/**
	 * The text encoding to use
	 *
	 * Note that UTF-16 and UTF-16BE are only supported in ID3v2.3+
	 */
	textEncoding?: TextEncoding;
}