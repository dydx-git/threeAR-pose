// A function to draw ellipses over the detected keypoints
export function drawKeypoints(ctx, poses) {
  // Loop through all the poses detected
  for (let i = 0; i < poses.length; i++) {
    // For each pose detected, loop through all the keypoints
    const pose = poses[i].pose;

    for (let j = 0; j < pose.keypoints.length; j++) {
      // A keypoint is an object describing a body part (like rightArm or leftShoulder)
      let keypoint = pose.keypoints[j];
      // Only draw an ellipse is the pose probability is bigger than 0.2
      if (keypoint.score > 0.2) {
        const { y, x } = keypoint.position;
        drawPoint(ctx, y - 2, x, 3);
      }
    }
  }
}

export function drawPoint(ctx, y, x, r, color = "#ff0000") {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}
