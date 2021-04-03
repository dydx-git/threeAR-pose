import { MaxEquation } from "three";

export function getPart(partname, pose) {
  return pose["keypoints"].filter(function (partpoint) {
    if (partpoint.part == partname) return true;
  });
}

export function getFacePose(pose) {
  const nose = getPart("nose", pose)[0];
  const leftEye = getPart("leftEye", pose)[0];
  const rightEye = getPart("rightEye", pose)[0];
  const leftEar = getPart("leftEar", pose)[0];
  const rightEar = getPart("rightEar", pose)[0];

  const _yaw = Math.atan2(
    2 * nose.position.x - leftEye.position.x - rightEye.position.x,
    leftEye.position.x - rightEye.position.x
  );
  return {
    yaw: getYaw(_yaw),
    pitch: getPitch(_yaw, nose.position, leftEar.position, rightEar.position),
  };
}

function getYaw(yaw) {
  return (yaw * -180) / Math.PI + 90;
}

function getPitch(yaw, nose, leftEar, rightEar) {
  const earYAvg = (leftEar.y + rightEar.y) / 2;
  return (
    (Math.asin(
      (2 * (nose.y - earYAvg) * Math.cos(yaw)) /
        Math.abs(rightEar.x - leftEar.x)
    ) *
      -180) /
      Math.PI +
    90
  );
}
