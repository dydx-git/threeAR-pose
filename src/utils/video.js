async function getMedia(constraints) {
	let stream = null;
	try {
		stream = await navigator.mediaDevices.getUserMedia(constraints);

		/* use the stream */
	} catch (err) {
		console.log("error in getting input stream: " + err.message);
	}
	return stream;
}

export async function getStream() {
	return await getMedia({
		video: {
			width: { ideal: 4096 },
			height: { ideal: 2160 },
		}, // navigator.mediaDevices.getSupportedConstraints()
	});
}

export function getPreferredVideoDimensions(stream) {
	const { width, height } = stream.getTracks()[0].getSettings();
	return [width, height];
}