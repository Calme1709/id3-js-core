enum FrameType {
	//Multiple entries with different names
	TextInformation,
	URL,

	//Multiple entry with same name but with distinct properties
	UserDefinedTextInformation,
	UserDefinedURL,
	UniqueFileIdentifier,
	UnsynchronisedLyrics,
	SynchronisedLyrics,
	Comment,
	AttachedPicture,
	GeneralEncapsulatedObject,
	Popularimeter,
	EncryptedMetaFrame,
	AudioEncryption,
	LinkedInformation,

	//Single entry
	InvolvedPeopleList,
	MusicCDIndentifier,
	EventTimingCodes,
	MPEGLocationLookupTable,
	SyncedTempoCodes,
	RelativeVolumeAdjustment,
	Equalisation,
	Reverb,
	PlayCounter,
	RecommendedBufferSize
}

export default FrameType;

export interface ISpecialTextFrame {
	language: string;
	description: string;
	value: string;
}

type TimestampUnit = "Milliseconds" | "MPEG Frames";

export interface IUniqueFileIdentifier {
	/**
	 * The identifier of the owner, this is likely either an email address,
	 * or a URL to a location where an email address can be found
	 */
	ownerIdentifier: string;

	/**
	 * Binary data that is used as a unique identifier
	 */
	identifier: string;
}

export interface IUserDefinedTextInformation {
	/**
	 * The description of the user defined text information frame
	 */
	description: string;

	/**
	 * The value of the user defined text information frame
	 */
	value: string;
}

export interface IUserDefinedURL {
	/**
	 * The description of the user defined URL frame
	 */
	description: string;

	/**
	 * The value of the user defined URL frame
	 */
	value: string;
}

export type InvolvedPeopleList = {[key: string]: string};

export interface IEventTimingCodes {
	/**
	 * The unit of the timestamps
	 */
	timestampUnit: TimestampUnit;

	/**
	 * An array of the events stored in this frame
	 */
	events: Array<{
		/**
		 * The type of array
		 */
		eventType: "padding" | "end of initial silence" | "intro start" | "mainpart start" | "outro start" | "outro end" | "verse start" | "refrain start" | "interlude start" | "theme start" | "variation start" | "key change" | "time change" | "momentary unwanted noise" | "sustained noise" | "sustained noise end" | "intro end" | "mainpart end" | "verse end" | "refrain end" | "theme end" | "profanity" | "profanity end" | "audio end" | "audio file ends" | "user defined event 0" | "user defined event 1" | "user defined event 2" | "user defined event 3" | "user defined event 4" | "user defined event 5" | "user defined event 6" | "user defined event 7" | "user defined event 8" | "user defined event 9" | "user defined event 10" | "user defined event 11" | "user defined event 12" | "user defined event 13" | "user defined event 14" | "user defined event 15";

		/**
		 * The time at which this event occurs in the audio file, unit outlined by the timestampUnit property
		 */
		time: number;
	}>;
}

export interface IMpegLookupTable {
	/**
	 * The number of frames between each reference
	 */
	framesBetweenReferences: number;

	/**
	 * The number of bytes between each references
	 */
	bytesBetweenReferences: number;

	/**
	 * The number of milliseconds between each reference
	 */
	millisecondsBetweenReferences: number;

	/**
	 * The references in this frame and their deviations from the standard reference differences
	 */
	references: Array<{
		/**
		 * By how many bytes this reference deviated
		 */
		byteDeviation: number;

		/**
		 * By how many milliseconds this reference deviated
		 */
		millisecondsDeviation: number;
	}>;
}

export interface ISynchronisedTempoCodes {
	/**
	 * The timestamp unit used for the tempo data
	 */
	timestampUnit: TimestampUnit;

	/**
	 * An array of all the tempo data
	 */
	tempoData: Array<{
		/**
		 * The tempo at this point in time
		 */
		tempo: string;

		/**
		 * The time, the unit of which is described in timestampUnit
		 */
		time: number;
	}>;
}

export interface ISynchronisedLyrics {
	timestampUnit: TimestampUnit;
	type: "Other" | "Lyrics" | "Text transcription" | "Movement/Part name" | "Events" | "Chord" | "Trivia/popup information" | "Image URLs" | "Webpage URLs";
	description: string;
	language: string;
	syncs: Array<{
		value: string;
		time: number;
	}>;
}

interface IRelativeChannelVolumeAdjustment {
	increment: boolean;
	peakVolume: number;
	relativeAdjustment: number;
}

export interface IRelativeVolumeAdjustment {
	right: IRelativeChannelVolumeAdjustment;
	left: IRelativeChannelVolumeAdjustment;
	rightBack?: IRelativeChannelVolumeAdjustment;
	leftBack?: IRelativeChannelVolumeAdjustment;
	center?: IRelativeChannelVolumeAdjustment;
	bass?: IRelativeChannelVolumeAdjustment;
}

export interface IEqualisation {
	increment: boolean;
	frequency: number;
	adjustment: number;
}

export interface IReverb {
	left: number;
	right: number;
	bounces: {
		left: number;
		right: number;
	};
	feeback: {
		leftToLeft: number;
		leftToRight: number;
		rightToRight: number;
		rightToLeft: number;
	};
	premix: {
		leftToRight: number;
		rightToLeft: number;
	};
}

export interface IPicture {
	mimeType: string;
	pictureType: "Other" | "32x32 pixels 'file icon' (PNG only)" | "Other file icon" | "Cover (front)" | "Cover (back)" | "Leaflet page" | "Media (e.g. lable side of CD)" | "Lead artist/lead performer/soloist" | "Artist/performer" | "Conductor" | "Band/Orchestra" | "Composer" | "Lyricist/text writer" | "Recording Location" | "During recording" | "During performance" | "Movie/video screen capture" | "A bright coloured fish" | "Illustration" | "Band/artist logotype" | "Publisher/Studio logotype";
	description: string;
	pictureData: Buffer;
}

export interface IGeneralEncapsulatedObject {
	mimeType: string;
	fileName: string;
	description: string;
	object: Buffer;
}

export interface IPopularimeter {
	user: string;
	rating: number;
	counter: number;
}

export interface IRecommendedBufferSize {
	size: number;
	embeddedInfo: boolean;
	offsetToNextFlag: number;
}

export interface IAudioEncryption {
	owner: string;
	preview: {
		start: number;
		length: number;
	};
	encryptionInfo: Buffer;
}

export interface ILinkedInformation {
	frame: string;
	url: string;
	addtionalData: string[];
}

export interface IPositionSynchronisation {
	timestampUnit: TimestampUnit;
	position: number;
}

export interface ITermsOfUse {
	lanuage: string;
	text: string;
}

export interface IOwnership {
	price: string;
	date: string;
	seller: string;
}

export interface ICommercial {
	price: string;
	validUntil: string;
	contactURL: string;
	receivedAs: "Other" | "Standard CD album with other songs" | "Compressed audio on CD" | "File over the Internet" | "Stream over the Internet" | "As note sheets" | "As note sheets in a book with other sheets" | "Music on other media" | "Non-musical merchandise";
	seller: string;
	description: string;
	logoMimeType: string;
	sellerLogo: Buffer;
}

export interface IEncryptionMethodRegistration {
	owner: string;
	method: number;
	encryptionData: Buffer;
}

export interface IGroupIdentificationRegistration { 
	owner: string;
	groupSymbol: number;
	groupDependantData: Buffer;
}

export interface IPrivate {
	owner: string;
	data: Buffer;
}

export interface IEncyptedMeta { 
	owner: string;
	content: string;
	encryptedData: Buffer;
}

export interface IAudioSeekPointIndex { 
	start: number;
	length: number;
	numberOfIndexPoints: number;
	bitsPerIndex: number;
	fractionsAtIndexes: number[];
}

export interface IEqualisation2 {
	interpolationMethod: "band" | "linear";
	identification: string;
	adjustmentPoints: Array<{
		frequency: number;
		volumeAdjustment: number;
	}>;
}

export interface IRelativeVolumeAdjustment2 {
	identification: string;
	channel: "Other" | "Master volume" | "Front right" | "Front left" | "Back right" | "Back left" | "Front centre" | "Back centre" | "Subwoofer";
	volumeAdjustment: number;
	peakVolume: number;
}

export interface ISeek {
	minimumOffsetToNextTag: number;
}

export interface ISignature {
	groupSymbol: number;
	signature: Buffer;
}