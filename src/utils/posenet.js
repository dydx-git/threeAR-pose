import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-backend-webgl";

export function getPart(partname, pose) {
	return pose["keypoints"].filter(function (partpoint) {
		if (partpoint.name == partname) return true;
	});
}

export function getFacePose(keypoints) {
	const nose = getPart("nose", keypoints)[0];
	const leftEye = getPart("left_eye", keypoints)[0];
	const rightEye = getPart("right_eye", keypoints)[0];
	const leftEar = getPart("left_ear", keypoints)[0];
	const rightEar = getPart("right_ear", keypoints)[0];
	//const leftShoulder = getPart("left_shoulder", keypoints)[0];
	//const rightShoulder = getPart("right_shoulder", keypoints)[0];
  
	//console.log(nose);

	const nosePosition = [nose.x, nose.y];
	const leftEyePosition = [leftEye.x, leftEye.y];
	const rightEyePosition = [rightEye.x, rightEye.y];
	const leftEarPosition = [leftEar.x, leftEar.y];
	const rightEarPosition = [rightEar.x, rightEar.y];

	//console.log(leftEarPosition);

	const _yaw = Math.atan2(
		2 * nosePosition[0] - leftEyePosition[0] - rightEyePosition[0],
		leftEyePosition[0] - rightEyePosition[0]
	);
	return {
		yaw: getYaw(_yaw),
		pitch: getPitch(_yaw, nosePosition, leftEarPosition, rightEarPosition),
	//	leftShoulder: leftShoulder,
    //rightShoulder: rightShoulder,
	};
}

function getYaw(yaw) {
	return (yaw * -180) / Math.PI + 90;
}

function getPitch(yaw, nosePosition, leftEarPosition, rightEarPosition) {
	const earYAvg = (leftEarPosition[1] + rightEarPosition[1]) / 2;
	return (
		(Math.asin(
			(2 * (nosePosition[1] - earYAvg) * Math.cos(yaw)) /
        Math.abs(rightEarPosition[0] - leftEarPosition[0])
		) *
      -180) /
      Math.PI +
    90
	);
}

export async function initPosenet() {
	const detectorConfig = {
		modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
	};
	const detector = await poseDetection.createDetector(
		poseDetection.SupportedModels.MoveNet,
		detectorConfig
	);
	return detector;
};