import {getPart, getFacePose} from "./posenet";
import * as THREE from "three/build/three.module";
import {rotateJoint} from "./transform";

let pitchFactor = 75;
const raycaster = new THREE.Raycaster();
const meshPosition = new THREE.Vector2();

export function FaceRotation(pivot,poses){
    const { yaw, pitch } = getFacePose(poses[0]);

    let normalizedYaw = (yaw - 90) * (Math.PI / 180);
    let normalizedPitch = (pitch - pitchFactor) * (Math.PI / 180);
    if (normalizedYaw) {
        pivot.rotation.y = normalizedYaw; // Left Right
        pivot.rotation.x = -normalizedPitch; // Up down
       }
}

export function Mask(poses, xOffset, yOffset){
    
    const nose = getPart("nose", poses[0])[0];
    meshPosition.x = nose.x + xOffset;
    meshPosition.y = nose.y + yOffset;
  
    return meshPosition;
    
}

export function Glasses(poses, xOffset, yOffset){
    const leftEye = getPart("left_eye", poses[0])[0];
    const rightEye = getPart("right_eye", poses[0])[0];
    const eyesPosition = new THREE.Vector2();
    eyesPosition.x = ((leftEye.x + rightEye.x) / 2) + xOffset;
    eyesPosition.y = ((leftEye.y + rightEye.y) / 2) + yOffset;

    return eyesPosition;
}

export function TraverseBones(pivot, mesh,poses, VIDEO_WIDTH, VIDEO_HEIGHT, camera){
    //pivot.position.set(0, -1, 1);

    const leftArmPoints = rotateJoint('right_shoulder', 'left_shoulder','left_elbow',poses[0]);
    const leftForeArmPoints = rotateJoint('left_shoulder', 'left_elbow','left_wrist',poses[0]);
    const rightArmPoints = rotateJoint('left_shoulder', 'right_shoulder','right_elbow',poses[0]);
    const rightForeArmPoints = rotateJoint('right_shoulder','right_elbow','right_wrist',poses[0]);

    mesh.traverse(function (child) {
        if (child.isBone) {
            if (
              [
                "mixamorigLeftForeArm",
                "mixamorigLeftShoulder",
                "mixamorigLeftArm",
                "mixamorigLeftHand",
              ].includes(child.name)
            ) 


            if(child.isBone && child.name === 'mixamorigRightForeArm'){
                child.rotation.x = (rightForeArmPoints) * 1.8;
                // controls.attach(child);
              }
  
              if(child.isBone && child.name === 'mixamorigRightArm'){
                child.rotation.x = (rightArmPoints) * 1.8;
                // controls.attach(child);
              }
              if(child.isBone && child.name === 'mixamorigLeftForeArm'){
                child.rotation.x = (leftForeArmPoints) * 2;
                // controls.attach(child);
              }
              if(child.isBone && child.name === 'mixamorigLeftArm'){
                child.rotation.x = (leftArmPoints) * 2;
                // controls.attach(child);
              }
            }
          });

            const meshPosition = new THREE.Vector2();
            let rightShoulder = getPart("right_shoulder", poses[0])[0];
            let leftShoulder = getPart("left_shoulder", poses[0])[0];
            const x1 = -((leftShoulder.x / VIDEO_WIDTH) * 2 - 1);
            const x2 = -((rightShoulder.x / VIDEO_WIDTH) * 2 - 1);
            const y1 = -((leftShoulder.y / VIDEO_HEIGHT) * 2 );
            const y2 =-((rightShoulder.y / VIDEO_HEIGHT) * 2 );
            meshPosition.x = (x1 + x2) / 2 ;
            meshPosition.y = (y1 + y2) / 2;
            raycaster.setFromCamera(meshPosition, camera);
            const dist = pivot.position.clone().sub(camera.position).length();
            raycaster.ray.at(dist, pivot.position);
            
}

