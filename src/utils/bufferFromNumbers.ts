import { Buffer } from "buffer";

/**
 * Create a buffer from an array of numbers
 * @param numbers - The numbers to create a buffer from
 * @param size - The size of the buffer to create (defaults to the minimum size to store the passed number)
 */
export default (numbers: number[], bytesPerNumber?: number) => {
	const bufferSize = typeof bytesPerNumber === "number" ?
		bytesPerNumber * numbers.length :
		numbers.reduce((acc, cur) => acc + Math.ceil(Math.log2(cur + 1) / 8));

	const buffer = Buffer.alloc(bufferSize, 0);

	let offset = 0;

	numbers.forEach(num => {
		const byteLength = typeof bytesPerNumber === "number" ? bytesPerNumber : Math.ceil(Math.log2(num + 1) / 8);

		buffer.writeIntBE(num, offset, byteLength);

		offset += byteLength;
	});

	return buffer;
};