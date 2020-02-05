import { ITagRestrictions } from '../decoder/decodeTagHeader';
import { TextEncodingType, TextEncodingName } from '@utils';

/**
 * Modify an interface
 */
type Modify<T, R> = Omit<T, keyof R> & R;

/**
 * Options for encoding the tag
 */
export interface IEncodingOptions {
	ID3Version: 2 | 3 | 4;
	textEncoding: TextEncodingType;
	unsynchronisation: boolean;
	experimental: boolean;
	tagIsAnUpdate: boolean;
	crcData?: number;
	tagRestrictions?: ITagRestrictions;
}

/**
 * The type of the default options that are stored as default
 */
export type IDefaultEncodingOptions = Modify<IEncodingOptions, {
	textEncoding: TextEncodingName;
}>;

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
	textEncoding?: TextEncodingName;

	unsynchronisation?: boolean;
	experimental?: boolean;
	tagIsAnUpdate?: boolean;
	crcData?: number;
	tagRestrictions?: ITagRestrictions;
}