export interface IV3FrameFlags {
    discardOnTagAlteration: boolean;
    discardOnFileAlteration: boolean;
    readOnly: boolean;
    compression: boolean;
    encryption: boolean;
    groupingIdentity: boolean;
}

export interface IV4FrameFlags extends IV3FrameFlags {
    unsynchronisation: boolean;
    dataLengthIndicator: boolean;
}