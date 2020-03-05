import { Buffer } from "buffer";

/**
 * Create a buffer from an array of numbers
 * @param numbers - The numbers to create a buffer from
 * @param size - The size of the buffer to create (defaults to the minimum size to store the passed number)
 */
export default (numbers: number[], bytesPerNumber?: number) => {
	const bytesPerNum = typeof bytesPerNumber === "number" ?
		bytesPerNumber :
		Math.ceil(Math.log2(Math.max(...numbers) + 1) / 8);

	const buffer = Buffer.alloc(bytesPerNum * numbers.length, 0);

	numbers.forEach((num, index) => {
		buffer.writeIntBE(num, index * bytesPerNum, bytesPerNum);
	});

	return buffer;
};