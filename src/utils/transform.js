import {getPart} from "./posenet";

export function  rotateJoint(jointA,jointB,jointC,poses) {
    let jA = getPart(jointA, poses)[0];
    let jB = getPart(jointB, poses)[0];
    let jC = getPart(jointC, poses)[0];

   // console.log(jA);
    //console.log(jB);
    //console.log(jC);
    
    let angle = (p1,p2,p3) => {
        const p13 = Math.sqrt(Math.pow((p1.x - p3.x), 2) + Math.pow((p1.y - p3.y), 2));
        const p12 = Math.sqrt(Math.pow((p1.x - p2.x), 2) + Math.pow((p1.y - p2.y), 2));
        const p23 = Math.sqrt(Math.pow((p2.x - p3.x), 2) + Math.pow((p2.y - p3.y), 2));
        const resultRadian = Math.acos(((Math.pow(p12, 2)) + (Math.pow(p13, 2)) - (Math.pow(p23, 2))) / (2 * p12 * p13));
        return resultRadian;
    }
    let Angle = angle(jA,jB,jC)
    return {Angle};
}
