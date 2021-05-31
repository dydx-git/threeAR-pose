// A function to draw ellipses over the detected keypoints
export function drawKeypoints(ctx, poses) {
	// Loop through all the poses detected
	for (let i = 0; i < poses.length; i++) {
		// For each pose detected, loop through all the keypoints
		const pose = poses[i];

		for (let j = 0; j < pose.keypoints.length; j++) {
			// A keypoint is an object describing a body part (like rightArm or leftShoulder)
			let keypoint = pose.keypoints[j];
			// Only draw an ellipse is the pose probability is bigger than 0.2
			if (keypoint.score > 0.2) {
				const { y, x } = keypoint;
				drawPoint(ctx, y - 2, x, 3);
			}
		}
	}
	//return poses;
}

export function drawPoint(ctx, y, x, r, color = "#ff0000") {
	ctx.beginPath();
	ctx.arc(x, y, r, 0, 2 * Math.PI);
	ctx.fillStyle = color;
	ctx.fill();
}

export function drawHome(ctx) {
	// Set line width
	ctx.lineWidth = 10;

	// Wall
	ctx.strokeRect(75, 140, 150, 110);

	// Door
	ctx.fillRect(130, 190, 40, 60);

	// Roof
	ctx.beginPath();
	ctx.moveTo(50, 140);
	ctx.lineTo(150, 60);
	ctx.lineTo(250, 140);
	ctx.closePath();
	ctx.stroke();
}

export function get2DCanvasContext(canvasElement) {
	let ctx = canvasElement.getContext("2d");
	ctx.fillStyle = "#FF0000";
	ctx.fillRect(20, 20, 150, 100);
	//ctx.beginPath();
    //ctx.rect(100, 100, 150, 100);
    //ctx.stroke();
	return ctx;
}
