/**
 * The names of the possible timestamp units
 */
type TimestampUnitNames = "MPEGFrames" | "Milliseconds";

/**
 * A timestamp unit
 */
export default class TimestampUnit {
	public byteRepresentation: 1 | 2;
	public unit: TimestampUnitNames;

	/**
	 * Create a new timestamp unit class from the name of the timestamp unit
	 * @param unit - The name of the unit
	 */
	constructor(unit: TimestampUnitNames);

	/**
	 * Create a new timestamp unit class from the byte representation of the unit
	 * @param unit - The byte representation of the unit
	 */
	constructor(unit: number);
	constructor(unit: number | TimestampUnitNames){
		const unitName = typeof unit === "string" ? unit : this.getUnitFromByte(unit as 1 | 2);

		this.unit = unitName;
		this.byteRepresentation = this.getByteFromUnit(this.unit);
	}

	/**
	 * Convert this timestamp unit to a string
	 */
	public toString(){
		return this.unit === "MPEGFrames" ? "MPEG frames" : "milliseconds";
	}

	/**
	 * Get the unit of a timestamp from it's byte representation
	 * @param byte - The byte
	 * @returns The unit
	 */
	private getUnitFromByte(byte: 1 | 2){
		switch(byte){
			case 1:
				return "MPEGFrames";
			case 2:
				return "Milliseconds";

			default:
				throw new Error(`Invalid timestamp unit byte: ${byte}`);
		}
	}

	/**
	 * Get the byte representation of a timestamp unit
	 * @param unit - The unit
	 * @returns The byte representation
	 */
	private getByteFromUnit(unit: TimestampUnitNames){
		switch(unit){
			case "MPEGFrames":
				return 1;
			case "Milliseconds":
				return 2;

			default:
				throw new Error(`Invalid timestamp unit: ${unit}`);
		}
	}
}

export const TimestampUnits = {
	/**
	 * A timestamp unit for MPEG frames
	 */
	MPEGFrames: new TimestampUnit("MPEGFrames"),

	/**
	 * A timestamp unit for milliseconds
	 */
	Milliseconds: new TimestampUnit("Milliseconds")
};