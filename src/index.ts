import TextInformationFrame from './frames/textInformationFrame';
export default class ID3JS {
	public static write(){
		const frame = new TextInformationFrame("TEXT", "Test");

		const encodedFrame = frame.encode({ textEncoding: "latin1", ID3Version: 4 });
		
		console.log(encodedFrame.toString("hex").match(/../g)?.join(" "));
		console.log(frame.toString());

		console.log(new TextInformationFrame(encodedFrame, 4).toString());
	}

	public static read(){
		
	}

	public static remove(){

	}

	public static update(){

	}
}

ID3JS.write();